import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { NotificacionesRepositoryPort } from '../domain/ports/notificaciones-repository.port';
import {
  NotificacionDomain,
  NotificacionTipo,
  NotificacionPrioridad,
  NotificacionCanal,
} from '../domain/notificaciones.domain';
import {
  CreateNotificacionDto,
  CreateNotificacionMasivaDto,
  UpdatePreferenciasDto,
  NotificacionQueryDto,
} from '../infrastructure/dto/create-notificacion.dto';
import { NotificacionesGateway } from '../../websocket/infrastructure/gateways/notificaciones.gateway';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly notifRepo: NotificacionesRepositoryPort,
    @Optional()
    @Inject(NotificacionesGateway)
    private readonly wsGateway?: NotificacionesGateway,
  ) {}

  async create(dto: CreateNotificacionDto): Promise<NotificacionDomain> {
    const saved = await this.notifRepo.create({
      usuarioId: dto.usuarioId,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo || NotificacionTipo.INFO,
      prioridad: dto.prioridad || NotificacionPrioridad.MEDIA,
      canal: dto.canal || NotificacionCanal.IN_APP,
      referenciaTipo: dto.referenciaTipo,
      referenciaId: dto.referenciaId,
      accionUrl: dto.accionUrl,
    });

    this.wsGateway?.sendToUser(saved.usuarioId!, 'notificacion', {
      id: saved.id,
      titulo: saved.titulo,
      mensaje: saved.mensaje,
      tipo: saved.tipo,
      prioridad: saved.prioridad,
      createdAt: saved.createdAt,
    });

    this.sendPushIfNeeded(saved);
    return saved;
  }

  async createMasiva(
    dto: CreateNotificacionMasivaDto,
    creatorId: number,
  ): Promise<{ count: number }> {
    const notifications = dto.usuarioIds.map((usuarioId) => ({
      usuarioId,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo || NotificacionTipo.INFO,
      prioridad: dto.prioridad || NotificacionPrioridad.MEDIA,
    }));

    const saved = await this.notifRepo.createMasiva(notifications);
    this.logger.log(
      `Notificación masiva enviada a ${saved.length} usuarios por usuario ${creatorId}`,
    );
    return { count: saved.length };
  }

  async findByUser(usuarioId: number, query: NotificacionQueryDto) {
    return this.notifRepo.findByUser(usuarioId, query);
  }

  async marcarLeida(
    id: number,
    usuarioId: number,
  ): Promise<NotificacionDomain> {
    return this.notifRepo.marcarLeida(id, usuarioId);
  }

  async marcarTodasLeidas(usuarioId: number): Promise<{ count: number }> {
    const count = await this.notifRepo.marcarTodasLeidas(usuarioId);
    return { count };
  }

  async getNonReadCount(usuarioId: number): Promise<{ count: number }> {
    const count = await this.notifRepo.getNonReadCount(usuarioId);
    return { count };
  }

  async getPreferencias(usuarioId: number) {
    return this.notifRepo.getPreferencias(usuarioId);
  }

  async updatePreferencias(usuarioId: number, dto: UpdatePreferenciasDto) {
    return this.notifRepo.updatePreferencias(usuarioId, dto as any);
  }

  async remove(id: number, usuarioId: number): Promise<{ message: string }> {
    await this.notifRepo.softDelete(id, usuarioId);
    return { message: 'Notificación eliminada' };
  }

  private async sendPushIfNeeded(notif: NotificacionDomain): Promise<void> {
    try {
      const prefs = await this.notifRepo.getPreferencias(notif.usuarioId!);
      if (!prefs || !prefs.inAppEnabled) return;

      if (prefs.tiposSuscritos) {
        const tipos = JSON.parse(prefs.tiposSuscritos) as string[];
        if (tipos.length > 0 && !tipos.includes(notif.tipo)) return;
      }

      if (prefs.silentHoursStart && prefs.silentHoursEnd) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (
          currentTime >= prefs.silentHoursStart &&
          currentTime <= prefs.silentHoursEnd
        )
          return;
      }

      this.logger.debug(
        `Push notification to user ${notif.usuarioId}: ${notif.titulo}`,
      );
    } catch (err) {
      this.logger.error(`Error sending push: ${(err as Error).message}`);
    }
  }
}
