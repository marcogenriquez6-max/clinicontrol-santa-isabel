/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import {
  HospitalizacionController,
  CamaController,
} from './infrastructure/controllers/hospitalizacion.controller';
import { HospitalizacionService } from './application/hospitalizacion.service';

describe('HospitalizacionController', () => {
  let controller: HospitalizacionController;
  let hospService: HospitalizacionService;

  const mockHospService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    darAlta: jest.fn(),
    remove: jest.fn(),
    createNotaEvolucion: jest.fn(),
    findNotasEvolucion: jest.fn(),
    getStats: jest.fn(),
    createCama: jest.fn(),
    findAllCamas: jest.fn(),
    findCama: jest.fn(),
    updateCama: jest.fn(),
    removeCama: jest.fn(),
    getCamasDisponibles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalizacionController, CamaController],
      providers: [
        { provide: HospitalizacionService, useValue: mockHospService },
      ],
    }).compile();

    controller = module.get<HospitalizacionController>(
      HospitalizacionController,
    );
    hospService = module.get<HospitalizacionService>(HospitalizacionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('HospitalizacionController - POST /hospitalizacion', () => {
    it('should create a hospitalization', async () => {
      const dto = { pacienteId: 1, camaId: 1, motivoIngreso: 'Dolor' };
      const expected = { id: 1, ...dto };
      mockHospService.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any, { id: 1 });
      expect(result).toEqual(expected);
      expect(mockHospService.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('GET /hospitalizacion', () => {
    it('should return paginated hospitalizations', async () => {
      const expected = { data: [{ id: 1 }], meta: { total: 1 } };
      mockHospService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({ page: 1, limit: 20 } as any);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /hospitalizacion/stats', () => {
    it('should return stats', async () => {
      const expected = { totalCamas: 10, ocupadas: 5 };
      mockHospService.getStats.mockResolvedValue(expected);

      const result = await controller.getStats();
      expect(result).toEqual(expected);
    });
  });

  describe('GET /hospitalizacion/:id', () => {
    it('should return a hospitalization by id', async () => {
      const expected = { id: 1 };
      mockHospService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
    });
  });

  describe('PUT /hospitalizacion/:id', () => {
    it('should update a hospitalization', async () => {
      const dto = { observaciones: 'Updated' };
      const expected = { id: 1, ...dto };
      mockHospService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto as any);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /hospitalizacion/:id/alta', () => {
    it('should discharge a patient', async () => {
      const dto = { fechaAlta: new Date() };
      const expected = { id: 1, estado: 'alta' };
      mockHospService.darAlta.mockResolvedValue(expected);

      const result = await controller.darAlta(1, dto as any);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /hospitalizacion/:id', () => {
    it('should remove a hospitalization', async () => {
      mockHospService.remove.mockResolvedValue({ message: 'Eliminada' });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Eliminada' });
    });
  });

  describe('POST /hospitalizacion/:id/notas', () => {
    it('should create a nota de evolución', async () => {
      const dto = { fecha: new Date(), nota: 'Paciente estable' };
      const expected = { id: 1, ...dto };
      mockHospService.createNotaEvolucion.mockResolvedValue(expected);

      const result = await controller.createNota(1, dto as any, { id: 1 });
      expect(result).toEqual(expected);
      expect(mockHospService.createNotaEvolucion).toHaveBeenCalledWith(
        1,
        dto,
        1,
      );
    });
  });

  describe('GET /hospitalizacion/:id/notas', () => {
    it('should return notas', async () => {
      const expected = [{ id: 1, nota: 'Evoluciona bien' }];
      mockHospService.findNotasEvolucion.mockResolvedValue(expected);

      const result = await controller.findNotas(1);
      expect(result).toEqual(expected);
    });
  });
});

describe('CamaController', () => {
  let controller: CamaController;
  let hospService: HospitalizacionService;

  const mockHospService = {
    createCama: jest.fn(),
    findAllCamas: jest.fn(),
    findCama: jest.fn(),
    updateCama: jest.fn(),
    removeCama: jest.fn(),
    getCamasDisponibles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CamaController],
      providers: [
        { provide: HospitalizacionService, useValue: mockHospService },
      ],
    }).compile();

    controller = module.get<CamaController>(CamaController);
    hospService = module.get<HospitalizacionService>(HospitalizacionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /camas', () => {
    it('should create a cama', async () => {
      const dto = { codigoCama: 'CAMA-101', servicio: 'Urgencias' };
      const expected = { id: 1, ...dto };
      mockHospService.createCama.mockResolvedValue(expected);

      const result = await controller.create(dto as any);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /camas', () => {
    it('should return all camas', async () => {
      const expected = [{ id: 1, codigoCama: 'CAMA-101' }];
      mockHospService.findAllCamas.mockResolvedValue(expected);

      const result = await controller.findAll();
      expect(result).toEqual(expected);
    });

    it('should filter by servicio', async () => {
      const expected = [{ id: 1 }];
      mockHospService.findAllCamas.mockResolvedValue(expected);

      const result = await controller.findAll('Urgencias');
      expect(result).toEqual(expected);
      expect(mockHospService.findAllCamas).toHaveBeenCalledWith('Urgencias');
    });
  });

  describe('GET /camas/disponibles', () => {
    it('should return available camas', async () => {
      const expected = [{ id: 1, estado: 'disponible' }];
      mockHospService.getCamasDisponibles.mockResolvedValue(expected);

      const result = await controller.getDisponibles();
      expect(result).toEqual(expected);
    });

    it('should filter by servicio', async () => {
      mockHospService.getCamasDisponibles.mockResolvedValue([]);
      await controller.getDisponibles('Urgencias');
      expect(mockHospService.getCamasDisponibles).toHaveBeenCalledWith(
        'Urgencias',
      );
    });
  });

  describe('GET /camas/:id', () => {
    it('should return a cama by id', async () => {
      const expected = { id: 1 };
      mockHospService.findCama.mockResolvedValue(expected);

      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
    });
  });

  describe('PUT /camas/:id', () => {
    it('should update a cama', async () => {
      const dto = { piso: '2' };
      const expected = { id: 1, ...dto };
      mockHospService.updateCama.mockResolvedValue(expected);

      const result = await controller.update(1, dto as any);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /camas/:id', () => {
    it('should remove a cama', async () => {
      mockHospService.removeCama.mockResolvedValue({ message: 'Eliminada' });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Eliminada' });
    });
  });
});
