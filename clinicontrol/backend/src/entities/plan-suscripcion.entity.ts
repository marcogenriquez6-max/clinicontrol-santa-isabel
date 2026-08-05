import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plan_suscripcion')
export class PlanSuscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ length: 30, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioMensual: number;

  @Column({ type: 'smallint', default: 1 })
  maxSucursales: number;

  @Column({ type: 'smallint', default: 5 })
  maxMedicos: number;

  @Column({ default: 100 })
  maxPacientes: number;

  @Column({ default: false })
  incluyeLaboratorio: boolean;

  @Column({ default: false })
  incluyeFarmacia: boolean;

  @Column({ default: false })
  incluyeHospitalizacion: boolean;

  @Column({ default: false })
  incluyeFacturacion: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
