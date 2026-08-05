import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EspecialidadService } from './application/especialidad.service';
import { EspecialidadRepositoryPort } from './domain/ports/especialidad-repository.port';
import { EspecialidadDomain } from './domain/especialidad.domain';
import {
  CreateEspecialidadDto,
  UpdateEspecialidadDto,
} from './infrastructure/dto/create-especialidad.dto';

describe('EspecialidadService', () => {
  let service: EspecialidadService;
  let repo: jest.Mocked<EspecialidadRepositoryPort>;

  const mockEspecialidad: EspecialidadDomain = new EspecialidadDomain(
    1,
    'Cardiología',
    true,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EspecialidadService,
        {
          provide: EspecialidadRepositoryPort,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EspecialidadService>(EspecialidadService);
    repo = module.get(EspecialidadRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all especialidades', async () => {
      repo.findAll.mockResolvedValue([mockEspecialidad]);
      const result = await service.findAll();
      expect(result).toEqual([mockEspecialidad]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an especialidad by id', async () => {
      repo.findById.mockResolvedValue(mockEspecialidad);
      const result = await service.findOne(1);
      expect(result).toEqual(mockEspecialidad);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when especialidad not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new especialidad', async () => {
      const dto: CreateEspecialidadDto = { nombre: 'Cardiología' };
      repo.create.mockResolvedValue(mockEspecialidad);

      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockEspecialidad);
    });
  });

  describe('update', () => {
    it('should update an existing especialidad', async () => {
      const dto: UpdateEspecialidadDto = { nombre: 'Neurología' };
      const updatedEspecialidad = new EspecialidadDomain(
        1,
        'Neurología',
        true,
      );
      repo.findById.mockResolvedValue(mockEspecialidad);
      repo.update.mockResolvedValue(updatedEspecialidad);

      const result = await service.update(1, dto);
      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.update).toHaveBeenCalledWith(1, dto);
      expect(result.nombre).toBe('Neurología');
    });

    it('should throw NotFoundException when especialidad to update not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update(999, { nombre: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an especialidad', async () => {
      repo.findById.mockResolvedValue(mockEspecialidad);
      repo.delete.mockResolvedValue(undefined);
      await service.delete(1);
      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when especialidad to delete not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
