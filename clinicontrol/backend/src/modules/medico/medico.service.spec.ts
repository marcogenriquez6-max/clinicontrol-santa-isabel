import { Test, TestingModule } from '@nestjs/testing';
import { MedicoService } from './application/medico.service';
import { MedicoRepositoryPort } from './domain/ports/medico-repository.port';
import { NotFoundException } from '@nestjs/common';

describe('MedicoService', () => {
  let service: MedicoService;

  const mockMedico = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    especialidadId: 1,
    telefono: '12345678',
    email: 'juan@hospital.com',
    especialidad: { id: 1, nombre: 'Cardiología' },
  };

  const mockMedicoRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEspecialidad: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicoService,
        {
          provide: MedicoRepositoryPort,
          useValue: mockMedicoRepo,
        },
      ],
    }).compile();

    service = module.get<MedicoService>(MedicoService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all medicos', async () => {
      mockMedicoRepo.findAll.mockResolvedValue([mockMedico]);
      const result = await service.findAll();
      expect(mockMedicoRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMedico]);
    });

    it('should return empty array when no medicos exist', async () => {
      mockMedicoRepo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a medico by id', async () => {
      mockMedicoRepo.findById.mockResolvedValue(mockMedico);
      const result = await service.findOne(1);
      expect(mockMedicoRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMedico);
    });

    it('should throw NotFoundException when medico not found', async () => {
      mockMedicoRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEspecialidad', () => {
    it('should return medicos filtered by especialidadId', async () => {
      mockMedicoRepo.findByEspecialidad.mockResolvedValue([mockMedico]);
      const result = await service.findByEspecialidad(1);
      expect(mockMedicoRepo.findByEspecialidad).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockMedico]);
    });

    it('should return empty array when no medicos for especialidad', async () => {
      mockMedicoRepo.findByEspecialidad.mockResolvedValue([]);
      const result = await service.findByEspecialidad(999);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      especialidadId: 1,
      telefono: '12345678',
      email: 'juan@hospital.com',
    };

    it('should create and return a new medico', async () => {
      mockMedicoRepo.create.mockResolvedValue(mockMedico);
      const result = await service.create(createDto);
      expect(mockMedicoRepo.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMedico);
    });
  });

  describe('update', () => {
    const updateDto = {
      nombre: 'Juan Updated',
      telefono: '87654321',
    };

    it('should update an existing medico', async () => {
      mockMedicoRepo.findById.mockResolvedValue(mockMedico);
      mockMedicoRepo.update.mockResolvedValue({
        ...mockMedico,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);
      expect(mockMedicoRepo.findById).toHaveBeenCalledWith(1);
      expect(mockMedicoRepo.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.nombre).toBe('Juan Updated');
    });

    it('should throw NotFoundException when medico to update not found', async () => {
      mockMedicoRepo.findById.mockResolvedValue(null);
      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing medico', async () => {
      mockMedicoRepo.findById.mockResolvedValue(mockMedico);
      mockMedicoRepo.delete.mockResolvedValue(undefined);
      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(mockMedicoRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when medico to delete not found', async () => {
      mockMedicoRepo.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
