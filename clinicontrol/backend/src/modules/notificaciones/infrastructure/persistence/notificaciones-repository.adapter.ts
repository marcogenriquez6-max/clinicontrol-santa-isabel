import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificacionesRepositoryPort,
  NotificacionQuery,
  PaginationMeta,
} from '../../domain/ports/notificaciones-repository.port';
import {
  NotificacionDomain,
  PreferenciaNotificacionDomain,
} from '../../domain/notificaciones.domain';
import {
  Notificacion,
  PreferenciaNotificacion,
} from '../../../../entities/notificacion.entity';

@Injectable()
export class NotificacionesRepositoryAdapter implements NotificacionesRepositoryPort {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    @InjectRepository(PreferenciaNotificacion)
    private readonly preferenciaRepository: Repository<PreferenciaNotificacion>,
  ) {}

  private notifToDomain(orm: Notificacion): NotificacionDomain {
    return new NotificacionDomain(
      orm.id,
      orm.usuarioId,
      orm.titulo,
      orm.mensaje,
      orm.tipo,
      orm.prioridad,
      orm.canal,
      orm.leida,
      orm.fechaLectura,
      orm.referenciaTipo,
      orm.referenciaId,
      orm.accionUrl,
      orm.activo,
    );
  }

  private prefToDomain(
    orm: PreferenciaNotificacion,
  ): PreferenciaNotificacionDomain {
    return new PreferenciaNotificacionDomain(
      orm.id,
      orm.usuarioId,
      orm.inAppEnabled,
      orm.emailEnabled,
      orm.smsEnabled,
      orm.tiposSuscritos as string,
      orm.silentHoursStart,
      orm.silentHoursEnd,
    );
  }

  async create(data: Partial<NotificacionDomain>): Promise<NotificacionDomain> {
    const orm = this.notificacionRepository.create(data as any);
    const saved = await this.notificacionRepository.save(orm);
    return this.notifToDomain(saved as any);
  }

  async createMasiva(
    dtos: Array<{
      usuarioId: number;
      titulo: string;
      mensaje: string;
      tipo?: string;
      prioridad?: string;
    }>,
  ): Promise<NotificacionDomain[]> {
    const notifications = dtos.map((d) =>
      this.notificacionRepository.create(d as any),
    );
    const saved = await this.notificacionRepository.save(notifications as any);
    return saved.map((n: Record<string, unknown>) => this.notifToDomain(n as never));
  }

  async findByUser(
    usuarioId: number,
    query: NotificacionQuery,
  ): Promise<{ data: NotificacionDomain[]; meta: PaginationMeta }> {
    const { leida, tipo, prioridad, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { usuarioId, activo: true };
    if (leida !== undefined) where.leida = leida;
    if (tipo) where.tipo = tipo;
    if (prioridad) where.prioridad = prioridad;

    const [data, total] = await this.notificacionRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((o) => this.notifToDomain(o)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async marcarLeida(
    id: number,
    usuarioId: number,
  ): Promise<NotificacionDomain> {
    const notif = await this.notificacionRepository.findOne({
      where: { id, usuarioId },
    });
    if (!notif) throw new NotFoundException(`Notificación ${id} no encontrada`);
    notif.leida = true;
    notif.fechaLectura = new Date();
    const saved = await this.notificacionRepository.save(notif);
    return this.notifToDomain(saved as any);
  }

  async marcarTodasLeidas(usuarioId: number): Promise<number> {
    const result = await this.notificacionRepository.update(
      { usuarioId, leida: false } as any,
      { leida: true, fechaLectura: new Date() },
    );
    return result.affected || 0;
  }

  async getNonReadCount(usuarioId: number): Promise<number> {
    return this.notificacionRepository.count({
      where: { usuarioId, leida: false, activo: true },
    });
  }

  async softDelete(id: number, usuarioId: number): Promise<void> {
    const notif = await this.notificacionRepository.findOne({
      where: { id, usuarioId },
    });
    if (!notif) throw new NotFoundException(`Notificación ${id} no encontrada`);
    notif.activo = false;
    await this.notificacionRepository.save(notif);
  }

  async getPreferencias(
    usuarioId: number,
  ): Promise<PreferenciaNotificacionDomain> {
    let prefs = await this.preferenciaRepository.findOne({
      where: { usuarioId },
    });
    if (!prefs) {
      prefs = this.preferenciaRepository.create({ usuarioId });
      prefs = await this.preferenciaRepository.save(prefs);
    }
    return this.prefToDomain(prefs);
  }

  async updatePreferencias(
    usuarioId: number,
    data: Partial<PreferenciaNotificacionDomain>,
  ): Promise<PreferenciaNotificacionDomain> {
    let prefs = await this.preferenciaRepository.findOne({
      where: { usuarioId },
    });
    if (!prefs) {
      prefs = this.preferenciaRepository.create({ usuarioId });
    }
    if (data.inAppEnabled !== undefined) prefs.inAppEnabled = data.inAppEnabled;
    if (data.emailEnabled !== undefined) prefs.emailEnabled = data.emailEnabled;
    if (data.smsEnabled !== undefined) prefs.smsEnabled = data.smsEnabled;
    if (data.tiposSuscritos)
      prefs.tiposSuscritos = JSON.stringify(data.tiposSuscritos);
    if (data.silentHoursStart !== undefined)
      prefs.silentHoursStart = data.silentHoursStart;
    if (data.silentHoursEnd !== undefined)
      prefs.silentHoursEnd = data.silentHoursEnd;
    const saved = await this.preferenciaRepository.save(prefs);
    return this.prefToDomain(saved as any);
  }
}
