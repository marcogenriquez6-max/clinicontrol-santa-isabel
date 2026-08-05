import {
  NotificacionDomain,
  PreferenciaNotificacionDomain,
} from '../notificaciones.domain';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificacionQuery {
  leida?: boolean;
  tipo?: string;
  prioridad?: string;
  page?: number;
  limit?: number;
}

export abstract class NotificacionesRepositoryPort {
  abstract create(
    data: Partial<NotificacionDomain>,
  ): Promise<NotificacionDomain>;
  abstract createMasiva(
    dtos: Array<{
      usuarioId: number;
      titulo: string;
      mensaje: string;
      tipo?: string;
      prioridad?: string;
    }>,
  ): Promise<NotificacionDomain[]>;
  abstract findByUser(
    usuarioId: number,
    query: NotificacionQuery,
  ): Promise<{ data: NotificacionDomain[]; meta: PaginationMeta }>;
  abstract marcarLeida(
    id: number,
    usuarioId: number,
  ): Promise<NotificacionDomain>;
  abstract marcarTodasLeidas(usuarioId: number): Promise<number>;
  abstract getNonReadCount(usuarioId: number): Promise<number>;
  abstract softDelete(id: number, usuarioId: number): Promise<void>;
  abstract getPreferencias(
    usuarioId: number,
  ): Promise<PreferenciaNotificacionDomain>;
  abstract updatePreferencias(
    usuarioId: number,
    data: Partial<PreferenciaNotificacionDomain>,
  ): Promise<PreferenciaNotificacionDomain>;
}
