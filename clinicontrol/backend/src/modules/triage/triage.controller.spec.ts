import { Test, TestingModule } from '@nestjs/testing';
import { TriageController } from './infrastructure/controllers/triage.controller';
import { TriageService } from './application/triage.service';
import { ESILevel, TriageEstado } from '../../entities/triage.entity';

describe('TriageController', () => {
  let controller: TriageController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPaciente: jest.fn(),
    findActivos: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriageController],
      providers: [{ provide: TriageService, useValue: mockService }],
    }).compile();

    controller = module.get<TriageController>(TriageController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user', async () => {
      const dto = {
        pacienteId: 1,
        esiNivel: ESILevel.TRES,
        temperatura: 36.5,
        frecuenciaCardiaca: 72,
        presionSistolica: 120,
        presionDiastolica: 80,
        spo2: 98,
        motivoConsulta: 'Dolor abdominal',
      };
      mockService.create.mockResolvedValue({} as any);
      await controller.create(dto, mockUser);
      expect(mockService.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { estado: TriageEstado.ACTIVO, page: 1, limit: 20 };
      mockService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      await controller.findAll(query);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findActivos', () => {
    it('should call service.findActivos', async () => {
      mockService.findActivos.mockResolvedValue([]);
      await controller.findActivos();
      expect(mockService.findActivos).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockService.findOne.mockResolvedValue({} as any);
      await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findByPaciente', () => {
    it('should call service.findByPaciente with id', async () => {
      mockService.findByPaciente.mockResolvedValue([]);
      await controller.findByPaciente(1);
      expect(mockService.findByPaciente).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { estado: TriageEstado.COMPLETADO, atendidoPorId: 2 };
      mockService.update.mockResolvedValue({} as any);
      await controller.update(1, dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Eliminado' });
      await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});
