import { UsuarioDomain } from '../usuario.domain';

export abstract class UsuarioRepositoryPort {
  abstract findAll(): Promise<UsuarioDomain[]>;
  abstract findById(id: number): Promise<UsuarioDomain | null>;
  abstract findByEmail(email: string): Promise<UsuarioDomain | null>;
  abstract create(data: Partial<UsuarioDomain>): Promise<UsuarioDomain>;
  abstract update(
    id: number,
    data: Partial<UsuarioDomain>,
  ): Promise<UsuarioDomain>;
  abstract delete(id: number): Promise<void>;
  abstract validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
