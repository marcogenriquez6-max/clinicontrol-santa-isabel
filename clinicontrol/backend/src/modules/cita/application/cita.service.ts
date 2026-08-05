import { Injectable, NotFoundException } from '@nestjs/common';
import { CitaRepositoryPort } from '../domain/ports/cita-repository.port';
import { CitaDomainService } from '../domain/services/cita-domain.service';
import { CitaDomain } from '../domain/cita.domain';
import {
  CreateCitaDto,
  UpdateCitaDto,
  CitaQueryDto,
} from '../infrastructure/dto/create-cita.dto';

@Injectable()
export class CitaService {
  constructor(
    private readonly citaRepo: CitaRepositoryPort,
    private readonly citaDomainService: CitaDomainService,
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

  async create(dto: CreateCitaDto, usuarioId: number): Promise<CitaDomain> {
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
}
