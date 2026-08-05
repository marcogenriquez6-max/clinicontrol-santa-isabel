import { Test, TestingModule } from '@nestjs/testing';
import { NotificacionesController } from './infrastructure/controllers/notificaciones.controller';
import { NotificacionesService } from './application/notificaciones.service';
import {
  NotificacionTipo,
  NotificacionPrioridad,
} from '../../entities/notificacion.entity';

describe('NotificacionesController', () => {
  let controller: NotificacionesController;

  const mockService = {
    create: jest.fn(),
    createMasiva: jest.fn(),
    findByUser: jest.fn(),
    getNonReadCount: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    remove: jest.fn(),
    getPreferencias: jest.fn(),
    updatePreferencias: jest.fn(),
  };

  const mockUser = { id: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificacionesController],
      providers: [{ provide: NotificacionesService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificacionesController>(NotificacionesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = {
        usuarioId: 1,
        titulo: 'Test',
        mensaje: 'Mensaje',
        tipo: NotificacionTipo.INFO,
        prioridad: NotificacionPrioridad.MEDIA,
      };
      mockService.create.mockResolvedValue({} as any);
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('createMasiva', () => {
    it('should call service.createMasiva with dto and user id', async () => {
      const dto = { usuarioIds: [1, 2], titulo: 'M', mensaje: 'M' };
      mockService.createMasiva.mockResolvedValue({ count: 2 });
      await controller.createMasiva(dto, mockUser);
      expect(mockService.createMasiva).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findMine', () => {
    it('should call service.findByUser with user id and query', async () => {
      const query = { page: 1, limit: 20 };
      mockService.findByUser.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      await controller.findMine(mockUser, query);
      expect(mockService.findByUser).toHaveBeenCalledWith(1, query);
    });
  });

  describe('getNonReadCount', () => {
    it('should call service.getNonReadCount', async () => {
      mockService.getNonReadCount.mockResolvedValue({ count: 3 });
      await controller.getNonReadCount(mockUser);
      expect(mockService.getNonReadCount).toHaveBeenCalledWith(1);
    });
  });

  describe('marcarLeida', () => {
    it('should call service.marcarLeida with id and user id', async () => {
      mockService.marcarLeida.mockResolvedValue({} as any);
      await controller.marcarLeida(5, mockUser);
      expect(mockService.marcarLeida).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('marcarTodasLeidas', () => {
    it('should call service.marcarTodasLeidas', async () => {
      mockService.marcarTodasLeidas.mockResolvedValue({ count: 0 });
      await controller.marcarTodasLeidas(mockUser);
      expect(mockService.marcarTodasLeidas).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and user id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Eliminada' });
      await controller.remove(5, mockUser);
      expect(mockService.remove).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('getPreferencias', () => {
    it('should call service.getPreferencias', async () => {
      mockService.getPreferencias.mockResolvedValue({} as any);
      await controller.getPreferencias(mockUser);
      expect(mockService.getPreferencias).toHaveBeenCalledWith(1);
    });
  });

  describe('updatePreferencias', () => {
    it('should call service.updatePreferencias', async () => {
      const dto = { inAppEnabled: false };
      mockService.updatePreferencias.mockResolvedValue({} as any);
      await controller.updatePreferencias(mockUser, dto);
      expect(mockService.updatePreferencias).toHaveBeenCalledWith(1, dto);
    });
  });
});
