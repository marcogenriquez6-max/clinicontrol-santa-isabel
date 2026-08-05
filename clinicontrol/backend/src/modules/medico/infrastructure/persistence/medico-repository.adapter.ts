import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicoRepositoryPort } from '../../domain/ports/medico-repository.port';
import { MedicoDomain } from '../../domain/medico.domain';
import { Medico } from '../../../../entities/medico.entity';

@Injectable()
export class MedicoRepositoryAdapter implements MedicoRepositoryPort {
  constructor(
    @InjectRepository(Medico)
    private readonly repo: Repository<Medico>,
  ) {}

  private toDomain(orm: Medico): MedicoDomain {
    return new MedicoDomain(
      orm.id,
      orm.nombre,
      orm.apellido,
      orm.especialidadId,
      orm.telefono,
      orm.email,
      orm.usuarioId,
      orm.codigoMedico,
      orm.sucursalId,
      true,
    );
  }

  async findAll(): Promise<MedicoDomain[]> {
    const orms = await this.repo.find({ relations: ['especialidad'] });
    return orms.map((o) => this.toDomain(o));
  }

  async findById(id: number): Promise<MedicoDomain | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['especialidad', 'citas', 'consultas'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEspecialidad(especialidadId: number): Promise<MedicoDomain[]> {
    const orms = await this.repo.find({
      where: { especialidadId },
      relations: ['especialidad'],
    });
    return orms.map((o) => this.toDomain(o));
  }

  async create(data: Partial<MedicoDomain>): Promise<MedicoDomain> {
    const orm = this.repo.create(data as any);
    const saved = await this.repo.save(orm);
    return this.toDomain(saved as any);
  }

  async update(id: number, data: Partial<MedicoDomain>): Promise<MedicoDomain> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) throw new Error('Medico not found');
    Object.assign(orm, data);
    const saved = await this.repo.save(orm);
    return this.toDomain(saved as any);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
