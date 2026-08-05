import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Paciente } from './paciente.entity';
import { Medico } from './medico.entity';
import { EstadoCita } from './estado-cita.entity';
import { Usuario } from './usuario.entity';
import { Consulta } from './consulta.entity';
import { Sucursal } from './sucursal.entity';

@Entity('cita')
export class Cita {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id' })
  pacienteId: number;

  @ManyToOne(() => Paciente, (p) => p.citas)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'medico_id' })
  medicoId: number;

  @ManyToOne(() => Medico, (m) => m.citas)
  @JoinColumn({ name: 'medico_id' })
  medico: Medico;

  @Column({ type: 'timestamptz' })
  fecha: Date;

  @Column({ type: 'text' })
  horaInicio: string;

  @Column({ type: 'text' })
  horaFin: string;

  @Column({ name: 'estado_id' })
  estadoId: number;

  @ManyToOne(() => EstadoCita, (e) => e.citas)
  @JoinColumn({ name: 'estado_id' })
  estado: EstadoCita;

  @Column({ name: 'creado_por' })
  creadoPorId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creadoPor: Usuario;

  @Column({ nullable: true })
  cancelacionMotivo: string;

  @Column({ name: 'cancelado_por', nullable: true })
  canceladoPorId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'cancelado_por' })
  canceladoPor: Usuario;

  @Column({ name: 'es_virtual', default: false })
  esVirtual: boolean;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'sucursal_id', nullable: true })
  sucursalId: number;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Consulta, (c) => c.cita)
  consulta: Consulta;
}
