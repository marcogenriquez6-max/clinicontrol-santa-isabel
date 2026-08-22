import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsuarioRepositoryPort } from '../domain/ports/usuario-repository.port';
import { UsuarioDomain } from '../domain/usuario.domain';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../infrastructure/dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private readonly usuarioRepo: UsuarioRepositoryPort) {}

  async findAll(): Promise<UsuarioDomain[]> {
    return this.usuarioRepo.findAll();
  }

  async findOne(id: number): Promise<UsuarioDomain> {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return usuario;
  }

  async findByEmail(email: string): Promise<UsuarioDomain | null> {
    return this.usuarioRepo.findByEmail(email);
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioDomain> {
    const existing = await this.usuarioRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const saved = await this.usuarioRepo.create({
      ...dto,
      password: hashedPassword,
      rolId: dto.rolId || 3,
    });
    return saved;
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<UsuarioDomain> {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.usuarioRepo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }

    return this.usuarioRepo.update(id, dto as any);
  }

  async delete(id: number): Promise<void> {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    await this.usuarioRepo.delete(id);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return this.usuarioRepo.validatePassword(plainPassword, hashedPassword);
  }
}
