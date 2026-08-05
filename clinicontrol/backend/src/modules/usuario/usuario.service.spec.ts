import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from './application/usuario.service';
import { UsuarioRepositoryPort } from './domain/ports/usuario-repository.port';
import { ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

const mockUsuario = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  ci: 'V-12345678',
  email: 'juan@hospital.com',
  password: 'hashed_password',
  rolId: 2,
  bloqueado: false,
  bloqueado_motivo: null,
  intentos_fallidos: 0,
  ultimo_login: null,
  mfa_secret: null,
  mfa_enabled: false,
  mfa_method: null,
  createdAt: new Date(),
  rol: { id: 2, nombre: 'Admin' },
} as unknown as import('./domain/usuario.domain').UsuarioDomain;

describe('UsuarioService', () => {
  let service: UsuarioService;

  const mockUsuarioRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: UsuarioRepositoryPort, useValue: mockUsuarioRepo },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all usuarios', async () => {
      mockUsuarioRepo.findAll.mockResolvedValue([mockUsuario]);
      const result = await service.findAll();
      expect(result).toEqual([mockUsuario]);
      expect(mockUsuarioRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a usuario by id', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      const result = await service.findOne(1);
      expect(result).toEqual(mockUsuario);
    });

    it('should throw NotFoundException when not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return usuario by email', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(mockUsuario);
      const result = await service.findByEmail('juan@hospital.com');
      expect(result).toEqual(mockUsuario);
    });

    it('should return null when email not found', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@test.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@hospital.com',
      password: 'Password1!',
      rolId: 2,
    };

    it('should create a usuario with hashed password', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(null);
      mockUsuarioRepo.create.mockResolvedValue(mockUsuario);

      const result = await service.create(createDto);
      expect(result).toEqual(mockUsuario);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(mockUsuarioRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_password' }),
      );
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(mockUsuario);
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should set default rolId to 3 if not provided', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(null);
      mockUsuarioRepo.create.mockResolvedValue(mockUsuario);

      await service.create({ ...createDto, rolId: undefined });
      expect(mockUsuarioRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ rolId: 3 }),
      );
    });
  });

  describe('update', () => {
    const updateDto = { nombre: 'Juan Updated', email: 'juan@hospital.com' };

    it('should update usuario successfully', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockUsuarioRepo.update.mockResolvedValue({ ...mockUsuario, ...updateDto });

      const result = await service.update(1, updateDto);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException on duplicate email', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockUsuarioRepo.findByEmail.mockResolvedValue({ ...mockUsuario, id: 2 });

      await expect(
        service.update(1, { email: 'existing@hospital.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password when updating it', async () => {
      const existingUser = { ...mockUsuario, email: 'juan@hospital.com' };
      mockUsuarioRepo.findById.mockResolvedValue(existingUser);
      mockUsuarioRepo.update.mockResolvedValue(existingUser);

      await service.update(1, { password: 'NewPass1!' });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 10);
    });
  });

  describe('delete', () => {
    it('should delete usuario', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockUsuarioRepo.delete.mockResolvedValue(undefined);
      await expect(service.delete(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      mockUsuarioRepo.validatePassword.mockResolvedValue(true);
      const result = await service.validatePassword('plain', 'hashed');
      expect(result).toBe(true);
      expect(mockUsuarioRepo.validatePassword).toHaveBeenCalledWith(
        'plain',
        'hashed',
      );
    });
  });
});
