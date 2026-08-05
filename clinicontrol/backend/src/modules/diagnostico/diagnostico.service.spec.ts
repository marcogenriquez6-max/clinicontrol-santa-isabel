import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticoService } from './application/diagnostico.service';
import { DiagnosticoRepositoryPort } from './domain/ports/diagnostico-repository.port';
import { NotFoundException } from '@nestjs/common';

describe('DiagnosticoService', () => {
  let service: DiagnosticoService;

  const mockDiagnostico = {
    id: 1,
    consultaId: 1,
    cie10Id: 1,
    codigo: 'I10',
    descripcion: 'Hipertensión esencial',
    tipo: 'principal',
    recomendaciones: 'Control mensual',
    esCronico: true,
    consulta: { id: 1 },
    cie10: { id: 1, codigo: 'I10', descripcion: 'Hipertensión esencial' },
  };

  const mockDiagnosticoRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByConsulta: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findCie10: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticoService,
        {
          provide: DiagnosticoRepositoryPort,
          useValue: mockDiagnosticoRepo,
        },
      ],
    }).compile();

    service = module.get<DiagnosticoService>(DiagnosticoService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all diagnosticos', async () => {
      mockDiagnosticoRepo.findAll.mockResolvedValue([mockDiagnostico]);
      const result = await service.findAll();
      expect(mockDiagnosticoRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockDiagnostico]);
    });

    it('should return empty array when no diagnosticos exist', async () => {
      mockDiagnosticoRepo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a diagnostico by id', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(mockDiagnostico);
      const result = await service.findOne(1);
      expect(mockDiagnosticoRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDiagnostico);
    });

    it('should throw NotFoundException when diagnostico not found', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByConsulta', () => {
    it('should return diagnosticos filtered by consultaId', async () => {
      mockDiagnosticoRepo.findByConsulta.mockResolvedValue([mockDiagnostico]);
      const result = await service.findByConsulta(1);
      expect(mockDiagnosticoRepo.findByConsulta).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockDiagnostico]);
    });

    it('should return empty array when no diagnosticos for consulta', async () => {
      mockDiagnosticoRepo.findByConsulta.mockResolvedValue([]);
      const result = await service.findByConsulta(999);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createDto = {
      consultaId: 1,
      cie10Id: 1,
      descripcion: 'Hipertensión esencial',
      recomendaciones: 'Control mensual',
      es_cronico: true,
    };

    it('should create and return a new diagnostico', async () => {
      mockDiagnosticoRepo.create.mockResolvedValue(mockDiagnostico);
      const result = await service.create(createDto);
      expect(mockDiagnosticoRepo.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockDiagnostico);
    });
  });

  describe('update', () => {
    const updateDto = {
      descripcion: 'Hipertensión esencial actualizada',
      recomendaciones: 'Control trimestral',
    };

    it('should update an existing diagnostico', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(mockDiagnostico);
      mockDiagnosticoRepo.update.mockResolvedValue({
        ...mockDiagnostico,
        ...updateDto,
      });
      const result = await service.update(1, updateDto);
      expect(mockDiagnosticoRepo.findById).toHaveBeenCalledWith(1);
      expect(mockDiagnosticoRepo.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.descripcion).toBe('Hipertensión esencial actualizada');
    });

    it('should throw NotFoundException when diagnostico to update not found', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(null);
      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing diagnostico', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(mockDiagnostico);
      mockDiagnosticoRepo.delete.mockResolvedValue(undefined);
      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(mockDiagnosticoRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when diagnostico to delete not found', async () => {
      mockDiagnosticoRepo.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCie10', () => {
    it('should search cie10 by query string', async () => {
      const cie10Results = [
        { id: 1, codigo: 'I10', descripcion: 'Hipertensión esencial' },
      ];
      mockDiagnosticoRepo.findCie10.mockResolvedValue(cie10Results);

      const result = await service.findCie10('hipert');
      expect(mockDiagnosticoRepo.findCie10).toHaveBeenCalledWith('hipert');
      expect(result).toEqual(cie10Results);
    });

    it('should return all cie10 entries when no query provided', async () => {
      const cie10List = [
        { id: 1, codigo: 'I10', descripcion: 'Hipertensión' },
        { id: 2, codigo: 'J45', descripcion: 'Asma' },
      ];
      mockDiagnosticoRepo.findCie10.mockResolvedValue(cie10List);

      const result = await service.findCie10();
      expect(mockDiagnosticoRepo.findCie10).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(cie10List);
    });

    it('should return empty array when no cie10 matches query', async () => {
      mockDiagnosticoRepo.findCie10.mockResolvedValue([]);

      const result = await service.findCie10('zzzzzz');
      expect(result).toEqual([]);
    });
  });
});
