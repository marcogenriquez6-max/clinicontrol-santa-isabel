import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Medico } from './medico.entity';

@Entity('especialidad')
export class Especialidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Medico, (m) => m.especialidad)
  medicos: Medico[];
}
