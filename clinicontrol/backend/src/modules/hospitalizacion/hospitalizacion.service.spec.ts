import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { HospitalizacionService } from './application/hospitalizacion.service';
import { HospitalizacionRepositoryPort } from './domain/ports/hospitalizacion-repository.port';

describe('HospitalizacionService', () => {
  let service: HospitalizacionService;
  let hospRepo: jest.Mocked<HospitalizacionRepositoryPort>;

  const mockCama: any = {
    id: 1,
    codigoCama: 'CAMA-101',
    servicio: 'Urgencias',
    piso: '1',
    habitacion: '101',
    estado: 'DISPONIBLE',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotaEvolucion: any = {
    id: 1,
    hospitalizacionId: 1,
    fecha: new Date(),
    nota: 'Paciente evoluciona favorablemente',
    plan: 'Continuar tratamiento',
    indicaciones: 'Signos vitales cada 4h',
    realizadoPorId: 1,
    activo: true,
    createdAt: new Date(),
    hospitalizacion: {},
    realizadoPor: {},
  };

  const mockHospitalizacion: any = {
    id: 1,
    pacienteId: 1,
    medicoTratanteId: 1,
    camaId: 1,
    fechaIngreso: new Date(),
    fechaAlta: undefined,
    motivoIngreso: 'Dolor abdominal agudo',
    diagnosticoIngreso: undefined,
    observaciones: undefined,
    notasAlta: undefined,
    diagnosticoAlta: undefined,
    estado: 'ADMITIDO',
    usuarioRegistroId: 1,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    paciente: {},
    medicoTratante: {},
    cama: {},
    usuarioRegistro: {},
    notasEvolucion: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalizacionService,
        {
          provide: HospitalizacionRepositoryPort,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            darAlta: jest.fn(),
            softDelete: jest.fn(),
            createCama: jest.fn(),
            findAllCamas: jest.fn(),
            findCamaById: jest.fn(),
            updateCama: jest.fn(),
            removeCama: jest.fn(),
            getCamasDisponibles: jest.fn(),
            createNotaEvolucion: jest.fn(),
            findNotasEvolucion: jest.fn(),
            getStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HospitalizacionService>(HospitalizacionService);
    hospRepo = module.get(HospitalizacionRepositoryPort);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a hospitalization', async () => {
      const dto = {
        pacienteId: 1,
        medicoTratanteId: 1,
        camaId: 1,
        fechaIngreso: new Date(),
        motivoIngreso: 'Dolor abdominal agudo',
      };

      hospRepo.create.mockResolvedValue(mockHospitalizacion);

      const result = await service.create(dto as any, 1);
      expect(result).toEqual(mockHospitalizacion);
      expect(hospRepo.create).toHaveBeenCalledWith(dto, 1);
    });

    it('should throw NotFoundException when cama not found', async () => {
      hospRepo.create.mockRejectedValue(
        new NotFoundException('Cama 999 no encontrada'),
      );
      await expect(service.create({ camaId: 999 } as any, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when cama is not available', async () => {
      hospRepo.create.mockRejectedValue(
        new ConflictException('Cama no disponible'),
      );
      await expect(service.create({ camaId: 1 } as any, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when patient has active hospitalization', async () => {
      hospRepo.create.mockRejectedValue(
        new ConflictException('Paciente ya tiene hospitalizacion activa'),
      );
      await expect(
        service.create({ pacienteId: 1, camaId: 1 } as any, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated hospitalizations', async () => {
      hospRepo.findAll.mockResolvedValue({
        data: [mockHospitalizacion],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
      const result = await service.findAll({ page: 1, limit: 20 } as any);
      expect(result.data).toEqual([mockHospitalizacion]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by estado', async () => {
      hospRepo.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      await service.findAll({ estado: 'ADMITIDO' } as any);
      expect(hospRepo.findAll).toHaveBeenCalledWith({ estado: 'ADMITIDO' });
    });

    it('should filter by pacienteId', async () => {
      hospRepo.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      await service.findAll({ pacienteId: 1 } as any);
      expect(hospRepo.findAll).toHaveBeenCalledWith({ pacienteId: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a hospitalization by id', async () => {
      hospRepo.findById.mockResolvedValue(mockHospitalizacion);
      const result = await service.findOne(1);
      expect(result).toEqual(mockHospitalizacion);
    });

    it('should throw NotFoundException when not found', async () => {
      hospRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a hospitalization', async () => {
      hospRepo.findById.mockResolvedValue({ ...mockHospitalizacion });
      hospRepo.update.mockResolvedValue({
        ...mockHospitalizacion,
        observaciones: 'Updated',
      });

      const result = await service.update(1, { observaciones: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should handle cama change', async () => {
      hospRepo.findById.mockResolvedValue({ ...mockHospitalizacion });
      hospRepo.update.mockResolvedValue({ ...mockHospitalizacion, camaId: 2 });

      await service.update(1, { camaId: 2 });
      expect(hospRepo.update).toHaveBeenCalledWith(1, { camaId: 2 });
    });

    it('should throw when new cama not found', async () => {
      hospRepo.findById.mockResolvedValue({ ...mockHospitalizacion });
      hospRepo.update.mockRejectedValue(
        new NotFoundException('Cama 999 no encontrada'),
      );

      await expect(service.update(1, { camaId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle estado change to ALTA', async () => {
      hospRepo.findById.mockResolvedValue({ ...mockHospitalizacion });
      hospRepo.update.mockResolvedValue({
        ...mockHospitalizacion,
        estado: 'ALTA',
      });

      const result = await service.update(1, { estado: 'ALTA' as any });
      expect(result).toBeDefined();
    });
  });

  describe('darAlta', () => {
    it('should discharge a patient', async () => {
      const altaDto = {
        fechaAlta: new Date(),
        notasAlta: 'Paciente recuperado',
        diagnosticoAlta: 'Neumonia resuelta',
      };

      hospRepo.darAlta.mockResolvedValue({
        ...mockHospitalizacion,
        estado: 'ALTA',
        ...altaDto,
      });

      const result = await service.darAlta(1, altaDto as any);
      expect(result.estado).toBe('ALTA');
      expect(hospRepo.darAlta).toHaveBeenCalledWith(1, altaDto);
    });

    it('should throw BadRequestException if already discharged', async () => {
      hospRepo.darAlta.mockRejectedValue(
        new BadRequestException('Paciente ya dado de alta'),
      );

      await expect(
        service.darAlta(1, { fechaAlta: new Date() } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a hospitalization', async () => {
      hospRepo.findById.mockResolvedValue({ ...mockHospitalizacion });
      hospRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Hospitalización eliminada exitosamente',
      });
      expect(hospRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('createCama', () => {
    it('should create a new cama', async () => {
      hospRepo.createCama.mockResolvedValue(mockCama);

      const result = await service.createCama({
        codigoCama: 'CAMA-101',
        servicio: 'Urgencias',
      } as any);
      expect(result).toEqual(mockCama);
    });

    it('should throw ConflictException if codigo already exists', async () => {
      hospRepo.createCama.mockRejectedValue(
        new ConflictException('Codigo de cama ya existe'),
      );
      await expect(
        service.createCama({ codigoCama: 'CAMA-101' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllCamas', () => {
    it('should return all camas', async () => {
      hospRepo.findAllCamas.mockResolvedValue([mockCama]);
      const result = await service.findAllCamas();
      expect(result).toEqual([mockCama]);
    });

    it('should filter by servicio', async () => {
      hospRepo.findAllCamas.mockResolvedValue([mockCama]);
      await service.findAllCamas('Urgencias');
      expect(hospRepo.findAllCamas).toHaveBeenCalledWith('Urgencias');
    });
  });

  describe('findCama', () => {
    it('should return a cama by id', async () => {
      hospRepo.findCamaById.mockResolvedValue(mockCama);
      const result = await service.findCama(1);
      expect(result).toEqual(mockCama);
    });

    it('should throw NotFoundException', async () => {
      hospRepo.findCamaById.mockResolvedValue(null);
      await expect(service.findCama(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCama', () => {
    it('should update a cama', async () => {
      hospRepo.findCamaById.mockResolvedValue(mockCama);
      hospRepo.updateCama.mockResolvedValue({ ...mockCama, piso: '2' });

      const result = await service.updateCama(1, { piso: '2' } as any);
      expect(result).toBeDefined();
    });
  });

  describe('removeCama', () => {
    it('should soft delete a cama', async () => {
      hospRepo.findCamaById.mockResolvedValue(mockCama);
      hospRepo.removeCama.mockResolvedValue(undefined);

      const result = await service.removeCama(1);
      expect(result).toEqual({ message: 'Cama eliminada exitosamente' });
    });

    it('should throw BadRequestException if cama is occupied', async () => {
      hospRepo.findCamaById.mockResolvedValue({
        ...mockCama,
        estado: 'OCUPADO',
      });
      hospRepo.removeCama.mockRejectedValue(
        new BadRequestException('Cama ocupada'),
      );
      await expect(service.removeCama(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createNotaEvolucion', () => {
    it('should create a nota de evolucion', async () => {
      hospRepo.createNotaEvolucion.mockResolvedValue(mockNotaEvolucion);

      const result = await service.createNotaEvolucion(
        1,
        {
          fecha: new Date(),
          nota: 'Evoluciona bien',
          plan: 'Continuar',
        } as any,
        1,
      );
      expect(result).toEqual(mockNotaEvolucion);
      expect(hospRepo.createNotaEvolucion).toHaveBeenCalledWith(
        1,
        {
          fecha: expect.any(Date),
          nota: 'Evoluciona bien',
          plan: 'Continuar',
        },
        1,
      );
    });

    it('should throw NotFoundException if hospitalization not found', async () => {
      hospRepo.createNotaEvolucion.mockRejectedValue(
        new NotFoundException('Hospitalizacion 999 no encontrada'),
      );
      await expect(
        service.createNotaEvolucion(999, {} as any, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findNotasEvolucion', () => {
    it('should return notas for a hospitalization', async () => {
      hospRepo.findNotasEvolucion.mockResolvedValue([mockNotaEvolucion]);
      const result = await service.findNotasEvolucion(1);
      expect(result).toEqual([mockNotaEvolucion]);
      expect(hospRepo.findNotasEvolucion).toHaveBeenCalledWith(1);
    });
  });

  describe('getCamasDisponibles', () => {
    it('should return available camas', async () => {
      hospRepo.getCamasDisponibles.mockResolvedValue([mockCama]);
      const result = await service.getCamasDisponibles();
      expect(result).toEqual([mockCama]);
    });

    it('should filter by servicio', async () => {
      hospRepo.getCamasDisponibles.mockResolvedValue([mockCama]);
      await service.getCamasDisponibles('Urgencias');
      expect(hospRepo.getCamasDisponibles).toHaveBeenCalledWith('Urgencias');
    });
  });

  describe('getStats', () => {
    it('should return occupancy statistics', async () => {
      hospRepo.getStats.mockResolvedValue({
        totalCamas: 10,
        ocupadas: 5,
        disponibles: 3,
        enLimpieza: 2,
        ocupacion: 50,
      });

      const result = await service.getStats();
      expect(result).toEqual({
        totalCamas: 10,
        ocupadas: 5,
        disponibles: 3,
        enLimpieza: 2,
        ocupacion: 50,
      });
    });

    it('should return 0 occupancy when no camas', async () => {
      hospRepo.getStats.mockResolvedValue({
        totalCamas: 0,
        ocupadas: 0,
        disponibles: 0,
        enLimpieza: 0,
        ocupacion: 0,
      });

      const result = await service.getStats();
      expect(result.ocupacion).toBe(0);
    });
  });
});
