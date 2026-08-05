import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from './usuario.entity';

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

@Entity('notificacion')
@Index('idx_notif_usuario', ['usuarioId'])
@Index('idx_notif_leida', ['leida'])
@Index('idx_notif_fecha', ['createdAt'])
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificacionTipo.INFO,
  })
  tipo: NotificacionTipo;

  @Column({
    type: 'varchar',
    length: 10,
    default: NotificacionPrioridad.MEDIA,
  })
  prioridad: NotificacionPrioridad;

  @Column({
    type: 'varchar',
    length: 10,
    default: NotificacionCanal.IN_APP,
  })
  canal: NotificacionCanal;

  @Column({ default: false })
  leida: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  fechaLectura: Date;

  @Column({ nullable: true })
  referenciaTipo: string;

  @Column({ nullable: true })
  referenciaId: number;

  @Column({ nullable: true })
  accionUrl: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('preferencia_notificacion')
@Index('idx_pref_notif_usuario', ['usuarioId'])
export class PreferenciaNotificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', unique: true })
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ default: true })
  inAppEnabled: boolean;

  @Column({ default: false })
  emailEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ type: 'simple-json', default: '{}' })
  tiposSuscritos: string;

  @Column({ type: 'text', nullable: true })
  silentHoursStart: string;

  @Column({ type: 'text', nullable: true })
  silentHoursEnd: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
