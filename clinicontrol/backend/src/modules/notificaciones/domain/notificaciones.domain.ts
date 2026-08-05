import { BaseEntity } from '../../../common/domain/base.entity';

export enum NotificacionTipo {
  INFO = 'info',
  EXITO = 'exito',
  ADVERTENCIA = 'advertencia',
  ERROR = 'error',
  ALERTA = 'alerta',
  RECORDATORIO = 'recordatorio',
}

export enum NotificacionPrioridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum NotificacionCanal {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  AMBOS = 'ambos',
}

export class NotificacionDomain extends BaseEntity {
  constructor(
    id?: number,
    public usuarioId?: number,
    public titulo?: string,
    public mensaje?: string,
    public tipo: NotificacionTipo = NotificacionTipo.INFO,
    public prioridad: NotificacionPrioridad = NotificacionPrioridad.MEDIA,
    public canal: NotificacionCanal = NotificacionCanal.IN_APP,
    public leida = false,
    public fechaLectura?: Date,
    public referenciaTipo?: string,
    public referenciaId?: number,
    public accionUrl?: string,
    public activo = true,
  ) {
    super(id);
  }
}

export class PreferenciaNotificacionDomain {
  constructor(
    id?: number,
    public usuarioId?: number,
    public inAppEnabled = true,
    public emailEnabled = false,
    public smsEnabled = false,
    public tiposSuscritos?: string,
    public silentHoursStart?: string,
    public silentHoursEnd?: string,
  ) {}
}
