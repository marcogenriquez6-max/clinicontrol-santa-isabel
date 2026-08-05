import { Test, TestingModule } from '@nestjs/testing';
import { TriageService } from '../application/triage.service';
import { TriageRepositoryPort } from '../domain/ports/triage-repository.port';
import { ESILevel, TriageEstado } from '../domain/triage.domain';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockTriageRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByPaciente: jest.fn(),
  findActivos: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('TriageService', () => {
  let service: TriageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriageService,
        {
          provide: TriageRepositoryPort,
          useValue: mockTriageRepo,
        },
      ],
    }).compile();

    service = module.get<TriageService>(TriageService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto = {
      pacienteId: 1,
      esiNivel: 3 as ESILevel,
      temperatura: 36.5,
      frecuenciaCardiaca: 72,
      presionSistolica: 120,
      presionDiastolica: 80,
      frecuenciaRespiratoria: 16,
      spo2: 98,
      glasgow: 15,
      motivoConsulta: 'Dolor abdominal',
    };

    it('should create a triage with valid vitals', async () => {
      const savedTriage = {
        id: 1,
        ...validDto,
        realizadoPorId: 1,
        fechaHora: new Date(),
        alertasCriticas: '[]',
        estado: TriageEstado.ACTIVO,
        activo: true,
      };
      mockTriageRepo.create.mockResolvedValue(savedTriage);

      const result = await service.create(validDto, 1);
      expect(result).toEqual(savedTriage);
      expect(mockTriageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pacienteId: 1,
          esiNivel: 3,
        }),
        1,
      );
    });

    it('should throw if temperature is out of range', async () => {
      await expect(
        service.create({ ...validDto, temperatura: 43 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if heart rate is out of range', async () => {
      await expect(
        service.create({ ...validDto, frecuenciaCardiaca: 290 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if blood pressure is invalid', async () => {
      await expect(
        service.create(
          { ...validDto, presionSistolica: 45, presionDiastolica: 80 },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if SpO2 is out of range', async () => {
      await expect(
        service.create({ ...validDto, spo2: 45 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if ESI level is inconsistent with vitals', async () => {
      const badEsiDto = {
        ...validDto,
        esiNivel: 2 as ESILevel,
        spo2: 98,
        frecuenciaCardiaca: 72,
      };
      await expect(service.create(badEsiDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass critical alert data to repo for storage', async () => {
      const criticalDto = {
        ...validDto,
        presionSistolica: 75,
        presionDiastolica: 50,
      };
      const savedTriage = { id: 1, ...criticalDto, alertasCriticas: '[]' };
      mockTriageRepo.create.mockResolvedValue(savedTriage);

      const result = await service.create(criticalDto, 1);
      expect(mockTriageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          presionSistolica: 75,
          presionDiastolica: 50,
        }),
        1,
      );
      expect(result).toBeDefined();
    });

    it('should handle ESI-1 without vitals validation beyond existence', async () => {
      const esi1Dto = {
        pacienteId: 1,
        esiNivel: 1 as ESILevel,
        motivoConsulta: 'Paro cardiorrespiratorio',
      };
      mockTriageRepo.create.mockResolvedValue({
        ...esi1Dto,
        realizadoPorId: 1,
      });

      await expect(service.create(esi1Dto, 1)).resolves.toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockData = [{ id: 1, paciente: { nombre: 'Test' } }];
      mockTriageRepo.findAll.mockResolvedValue({
        data: mockData,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply estado filter when provided', async () => {
      mockTriageRepo.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await service.findAll({
        estado: TriageEstado.ACTIVO,
        page: 1,
        limit: 20,
      });
      expect(mockTriageRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ estado: TriageEstado.ACTIVO }),
      );
    });

    it('should apply pacienteId filter when provided', async () => {
      mockTriageRepo.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await service.findAll({
        pacienteId: 5,
        page: 1,
        limit: 20,
      });
      expect(mockTriageRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ pacienteId: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a triage by id', async () => {
      const mockTriage = { id: 1, paciente: { nombre: 'Test' } };
      mockTriageRepo.findById.mockResolvedValue(mockTriage);
      const result = await service.findOne(1);
      expect(result).toEqual(mockTriage);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockTriageRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPaciente', () => {
    it('should return triages for a patient', async () => {
      mockTriageRepo.findByPaciente.mockResolvedValue([]);
      await service.findByPaciente(1);
      expect(mockTriageRepo.findByPaciente).toHaveBeenCalledWith(1);
    });

    it('should include realizadoPor relation', async () => {
      const mockTriages = [
        { id: 1, pacienteId: 1, realizadoPor: { id: 1, nombre: 'Dr. Test' } },
      ];
      mockTriageRepo.findByPaciente.mockResolvedValue(mockTriages);
      const result = await service.findByPaciente(1);
      expect(result).toEqual(mockTriages);
    });
  });

  describe('findActivos', () => {
    it('should return active triages', async () => {
      mockTriageRepo.findActivos.mockResolvedValue([]);
      await service.findActivos();
      expect(mockTriageRepo.findActivos).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return triage', async () => {
      const existing = {
        id: 1,
        estado: TriageEstado.ACTIVO,
        observaciones: 'old',
      };
      mockTriageRepo.findById.mockResolvedValue(existing);
      mockTriageRepo.update.mockResolvedValue({
        ...existing,
        estado: TriageEstado.COMPLETADO,
      });

      const result = await service.update(1, {
        estado: TriageEstado.COMPLETADO,
        atendidoPorId: 2,
      });
      expect(result.estado).toBe(TriageEstado.COMPLETADO);
    });

    it('should throw NotFoundException when triage not found', async () => {
      mockTriageRepo.findById.mockResolvedValue(null);
      await expect(
        service.update(999, { estado: TriageEstado.COMPLETADO }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a triage', async () => {
      const existing = { id: 1, activo: true };
      mockTriageRepo.findById.mockResolvedValue(existing);
      mockTriageRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Registro de triage eliminado exitosamente',
      });
      expect(mockTriageRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when triage not found', async () => {
      mockTriageRepo.findById.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
