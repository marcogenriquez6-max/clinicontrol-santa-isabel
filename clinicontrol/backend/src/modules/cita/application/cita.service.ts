import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CitaRepositoryPort } from '../domain/ports/cita-repository.port';
import { CitaDomainService } from '../domain/services/cita-domain.service';
import { CitaDomain } from '../domain/cita.domain';
import {
  CreateCitaDto,
  UpdateCitaDto,
  CitaQueryDto,
} from '../infrastructure/dto/create-cita.dto';
import { TurnoService } from '../../turno/application/turno.service';

@Injectable()
export class CitaService {
  constructor(
    private readonly citaRepo: CitaRepositoryPort,
    private readonly citaDomainService: CitaDomainService,
    private readonly turnoService: TurnoService,
  ) {}

  async findAll(query: CitaQueryDto) {
    return this.citaRepo.findAll(query);
  }

  async findOne(id: number): Promise<CitaDomain> {
    const cita = await this.citaRepo.findById(id);
    if (!cita) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }
    return cita;
  }

  async getDisponibilidad(medicoId: number, fecha: Date) {
    const data = await this.citaRepo.findDisponibilidad(medicoId, fecha);
    return {
      fecha,
      medicoId,
      citasOcupadas: data.filter(
        (d) => d.estado !== 'cancelada' && d.estado !== 'no_asistio',
      ),
      totalCitas: data.filter(
        (d) => d.estado !== 'cancelada' && d.estado !== 'no_asistio',
      ).length,
    };
  }

  private validarFechaNoPasada(fecha: Date | string): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(fecha);
    fechaCita.setHours(0, 0, 0, 0);
    if (fechaCita < hoy) {
      throw new BadRequestException(
        'No se puede agendar una cita en una fecha pasada',
      );
    }
  }

  async create(dto: CreateCitaDto, usuarioId: number): Promise<CitaDomain> {
    this.validarFechaNoPasada(dto.fecha);
    const domain = CitaDomain.create({
      pacienteId: dto.pacienteId,
      medicoId: dto.medicoId,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      esVirtual: dto.esVirtual,
      motivo: dto.motivo,
      sucursalId: dto.sucursalId,
      observaciones: dto.observaciones,
      creadoPorId: usuarioId,
    });

    const hayConflicto = await this.citaRepo.findConflicts(
      domain.medicoId,
      domain.fecha,
      domain.horaInicio,
      domain.horaFin,
    );
    this.citaDomainService.validarDisponibilidad(hayConflicto);

    return this.citaRepo.save(domain);
  }

  async update(id: number, dto: UpdateCitaDto): Promise<CitaDomain> {
    const cita = await this.findOne(id);

    if (dto.fecha) this.validarFechaNoPasada(dto.fecha);

    if (dto.horaInicio || dto.horaFin || dto.fecha) {
      const newHoraInicio = dto.horaInicio ?? cita.horaInicio;
      const newHoraFin = dto.horaFin ?? cita.horaFin;
      const newFecha = dto.fecha ?? cita.fecha;

      CitaDomain.validarHorario(newHoraInicio, newHoraFin);

      const hayConflicto = await this.citaRepo.findConflicts(
        cita.medicoId,
        newFecha,
        newHoraInicio,
        newHoraFin,
        id,
      );
      this.citaDomainService.validarDisponibilidad(hayConflicto);
    }

    if (dto.estadoId !== undefined) {
      const mapa: Record<number, CitaDomain['estado']> = {
        1: 'pendiente',
        2: 'confirmada',
        3: 'en_curso',
        4: 'completada',
        5: 'cancelada',
        6: 'no_asistio',
      };
      const estado = mapa[dto.estadoId];
      if (estado) {
        cita.estado = estado;
      }
    }
    if (dto.fecha !== undefined) cita.fecha = dto.fecha;
    if (dto.horaInicio !== undefined) cita.horaInicio = dto.horaInicio;
    if (dto.horaFin !== undefined) cita.horaFin = dto.horaFin;
    if (dto.motivo !== undefined) cita.motivo = dto.motivo;
    if (dto.observaciones !== undefined) cita.observaciones = dto.observaciones;
    if (dto.cancelacionMotivo !== undefined)
      cita.cancelacionMotivo = dto.cancelacionMotivo;

    return this.citaRepo.save(cita);
  }

  async cancelar(
    id: number,
    motivo: string,
    usuarioId: number,
  ): Promise<CitaDomain> {
    const cita = await this.findOne(id);
    cita.cancelar(motivo, usuarioId);
    return this.citaRepo.save(cita);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.citaRepo.remove(id);
  }

  async llegada(id: number, usuarioId: number): Promise<{ cita: CitaDomain; turno: any }> {
    const cita = await this.findOne(id);
    
    // Validar que la cita esté en estado pendiente o confirmada
    const esPendienteOConfirmada = cita.estado === 'pendiente' || cita.estado === 'confirmada';
    if (!esPendienteOConfirmada) {
      throw new BadRequestException(
        'La cita no está en estado pendiente o confirmada',
      );
    }
    
    // Verificar que no tenga turno previo (llegada doble)
    // Buscar si ya existe un turno para esta cita ese día, por paciente y fecha
    const { data: turnosDelDia } = await this.turnoService.findAll({
      pacienteId: cita.pacienteId,
      fecha: cita.fecha.toISOString().split('T')[0],
    });
    
    const fechaCitaStr = cita.fecha.toISOString().split('T')[0];
    const tieneTurnoPrevio = turnosDelDia.some(
      (t: any) => 
        String(t.fechaProgramada)?.substring(0, 10) === fechaCitaStr && t.estado !== 'cancelado'
    );
    
    if (tieneTurnoPrevio) {
      throw new ConflictException(
        `La cita ya tiene un turno emitido`,
      );
    }
    
    // Crear el turno usando el servicio de turno
    const turnoRes = await this.turnoService.create({
      pacienteId: cita.pacienteId,
      medicoId: cita.medicoId,
      monto: 0, // Se calculará según el servicio
      pagado: false,
      fechaProgramada: cita.fecha.toISOString().split('T')[0],
      horaProgramada: cita.horaInicio,
    });
    
    // Marcar la cita como en_curso (atendida)
    cita.estado = 'en_curso';
    await this.citaRepo.save(cita);
    
    return { cita, turno: turnoRes };
  }
}
