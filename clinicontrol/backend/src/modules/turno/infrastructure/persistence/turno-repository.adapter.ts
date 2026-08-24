import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  TurnoRepositoryPort,
  TurnoQuery,
} from '../../domain/ports/turno-repository.port';
import { TurnoDomain, EstadoTurno } from '../../domain/turno.domain';
import { Turno } from '../../../../entities/turno.entity';

@Injectable()
export class TurnoRepositoryAdapter implements TurnoRepositoryPort {
  constructor(
    @InjectRepository(Turno)
    private readonly repo: Repository<Turno>,
  ) {}

  private toDomain(orm: Turno): TurnoDomain {
    const d = new TurnoDomain(
      orm.numero,
      orm.pacienteId,
      orm.medicoId,
      orm.estado as EstadoTurno,
      Number(orm.monto),
      orm.pagado,
      orm.pagadoEn,
      orm.id,
      orm.citaId,
      orm.tipoAtencionId,
      orm.tipo,
      orm.paciente?.nombre,
      orm.paciente?.ci,
      orm.paciente?.telefono,
      `${orm.medico?.nombre || ''} ${orm.medico?.apellido || ''}`.trim(),
      orm.medico?.especialidad?.nombre,
      '',
    );
    d.fechaProgramada = orm.fechaProgramada;
    d.horaProgramada = orm.horaProgramada;
    return d;
  }

  async findAll(query: TurnoQuery) {
    const { estado, medicoId, pacienteId, fecha, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (medicoId) where.medico = { id: medicoId };
    if (pacienteId) where.paciente = { id: pacienteId };
    if (fecha) {
      const start = new Date(fecha);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fecha);
      end.setHours(23, 59, 59, 999);
      where.createdAt = LessThan(end) as any;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['paciente', 'medico', 'medico.especialidad'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((o) => this.toDomain(o)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: number): Promise<TurnoDomain | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['paciente', 'medico', 'medico.especialidad'],
    });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findTV(): Promise<TurnoDomain[]> {
    const data = await this.repo.find({
      where: [
        { estado: 'espera' },
        { estado: 'llamado' },
        { estado: 'atencion' },
      ],
      relations: ['paciente', 'medico', 'medico.especialidad'],
      order: { createdAt: 'ASC' },
    });
    return data.map((o) => this.toDomain(o));
  }

  async getUltimoNumero(): Promise<number> {
    const ultimo = await this.repo.findOne({
      order: { numero: 'DESC' },
    });
    return ultimo?.numero ?? 0;
  }

  async save(turno: TurnoDomain): Promise<TurnoDomain> {
    const orm = this.repo.create({
      numero: turno.numero,
      pacienteId: turno.pacienteId,
      medicoId: turno.medicoId,
      citaId: turno.citaId,
      tipoAtencionId: turno.tipoAtencionId,
      tipo: turno.tipo,
      estado: turno.estado,
      monto: turno.monto,
      pagado: turno.pagado,
      pagadoEn: turno.pagadoEn,
      fechaProgramada: turno.fechaProgramada,
      horaProgramada: turno.horaProgramada,
    });
    const saved = await this.repo.save(orm);
    return this.findById(saved.id) as Promise<TurnoDomain>;
  }

  async updateEstado(id: number, estado: EstadoTurno): Promise<TurnoDomain> {
    await this.repo.update(id, { estado });
    return this.findById(id) as Promise<TurnoDomain>;
  }

  async marcarPagado(id: number): Promise<TurnoDomain> {
    await this.repo.update(id, {
      pagado: true,
      pagadoEn: new Date(),
    });
    return this.findById(id) as Promise<TurnoDomain>;
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }
  }
}
