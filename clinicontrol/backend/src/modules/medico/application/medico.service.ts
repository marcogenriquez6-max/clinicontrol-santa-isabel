import { Injectable, NotFoundException } from '@nestjs/common';
import { MedicoRepositoryPort } from '../domain/ports/medico-repository.port';
import { MedicoDomain } from '../domain/medico.domain';
import {
  CreateMedicoDto,
  UpdateMedicoDto,
} from '../infrastructure/dto/create-medico.dto';

@Injectable()
export class MedicoService {
  constructor(private readonly medicoRepo: MedicoRepositoryPort) {}

  async findAll(): Promise<MedicoDomain[]> {
    return this.medicoRepo.findAll();
  }

  async findOne(id: number): Promise<MedicoDomain> {
    const entity = await this.medicoRepo.findById(id);
    if (!entity)
      throw new NotFoundException(`Médico con ID ${id} no encontrado`);
    return entity;
  }

  async findByEspecialidad(especialidadId: number): Promise<MedicoDomain[]> {
    return this.medicoRepo.findByEspecialidad(especialidadId);
  }

  async create(dto: CreateMedicoDto): Promise<MedicoDomain> {
    return this.medicoRepo.create(dto as any);
  }

  async update(id: number, dto: UpdateMedicoDto): Promise<MedicoDomain> {
    await this.findOne(id);
    return this.medicoRepo.update(id, dto as any);
  }

  async delete(id: number): Promise<void> {
    const entity = await this.medicoRepo.findById(id);
    if (!entity)
      throw new NotFoundException(`Médico con ID ${id} no encontrado`);
    await this.medicoRepo.delete(id);
  }
}
