import { Test, TestingModule } from '@nestjs/testing';
import { NotificacionesService } from './application/notificaciones.service';
import { NotificacionesRepositoryPort } from './domain/ports/notificaciones-repository.port';
import {
  NotificacionTipo,
  NotificacionPrioridad,
} from './domain/notificaciones.domain';
import { NotFoundException } from '@nestjs/common';

describe('NotificacionesService', () => {
  let service: NotificacionesService;

  const mockNotifRepo = {
    create: jest.fn(),
    createMasiva: jest.fn(),
    findByUser: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    getNonReadCount: jest.fn(),
    softDelete: jest.fn(),
    getPreferencias: jest.fn(),
    updatePreferencias: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        {
          provide: NotificacionesRepositoryPort,
          useValue: mockNotifRepo,
        },
      ],
    }).compile();

    service = module.get<NotificacionesService>(NotificacionesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      usuarioId: 1,
      titulo: 'Test',
      mensaje: 'Test message',
      tipo: NotificacionTipo.INFO as const,
      prioridad: NotificacionPrioridad.MEDIA as const,
    };

    it('should create a notification', async () => {
      const saved = { id: 1, ...dto };
      mockNotifRepo.create.mockResolvedValue(saved);

      const result = await service.create(dto);
      expect(result).toEqual(saved);
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Test' }),
      );
    });
  });

  describe('createMasiva', () => {
    it('should create notifications for multiple users', async () => {
      const dto = {
        usuarioIds: [1, 2, 3],
        titulo: 'Masivo',
        mensaje: 'Mensaje masivo',
      };
      mockNotifRepo.createMasiva.mockResolvedValue([{}, {}, {}]);

      const result = await service.createMasiva(dto, 1);
      expect(result).toEqual({ count: 3 });
      expect(mockNotifRepo.createMasiva).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByUser', () => {
    it('should return paginated notifications', async () => {
      const data = [{ id: 1, titulo: 'Test' }];
      mockNotifRepo.findByUser.mockResolvedValue({
        data,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findByUser(1, { page: 1, limit: 20 });
      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      mockNotifRepo.findByUser.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });

      await service.findByUser(1, {
        leida: false,
        tipo: NotificacionTipo.INFO,
        prioridad: NotificacionPrioridad.ALTA,
        page: 1,
        limit: 10,
      });

      expect(mockNotifRepo.findByUser).toHaveBeenCalledWith(1, {
        leida: false,
        tipo: NotificacionTipo.INFO,
        prioridad: NotificacionPrioridad.ALTA,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getNonReadCount', () => {
    it('should return count of unread notifications', async () => {
      mockNotifRepo.getNonReadCount.mockResolvedValue(5);

      const result = await service.getNonReadCount(1);
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('marcarLeida', () => {
    it('should mark notification as read', async () => {
      const notif = { id: 1, usuarioId: 1, leida: true, fechaLectura: new Date() };
      mockNotifRepo.marcarLeida.mockResolvedValue(notif);

      const result = await service.marcarLeida(1, 1);
      expect(result.leida).toBe(true);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotifRepo.marcarLeida.mockRejectedValue(
        new NotFoundException('Notificación no encontrada'),
      );
      await expect(service.marcarLeida(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('marcarTodasLeidas', () => {
    it('should mark all as read', async () => {
      mockNotifRepo.marcarTodasLeidas.mockResolvedValue(3);

      const result = await service.marcarTodasLeidas(1);
      expect(result).toEqual({ count: 3 });
      expect(mockNotifRepo.marcarTodasLeidas).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should soft-delete a notification', async () => {
      mockNotifRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.remove(1, 1);
      expect(result).toEqual({ message: 'Notificación eliminada' });
      expect(mockNotifRepo.softDelete).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotifRepo.softDelete.mockRejectedValue(
        new NotFoundException('Notificación no encontrada'),
      );
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreferencias', () => {
    it('should return existing preferences', async () => {
      const prefs = { id: 1, usuarioId: 1, inAppEnabled: true };
      mockNotifRepo.getPreferencias.mockResolvedValue(prefs);

      const result = await service.getPreferencias(1);
      expect(result).toEqual(prefs);
    });
  });

  describe('updatePreferencias', () => {
    it('should update existing preferences', async () => {
      const prefs = {
        id: 1,
        usuarioId: 1,
        inAppEnabled: false,
        emailEnabled: false,
      };
      mockNotifRepo.updatePreferencias.mockResolvedValue(prefs);

      const result = await service.updatePreferencias(1, {
        inAppEnabled: false,
      });
      expect(result).toBeDefined();
    });
  });
});
