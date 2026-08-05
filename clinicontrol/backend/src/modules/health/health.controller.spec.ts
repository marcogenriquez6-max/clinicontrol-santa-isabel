import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './infrastructure/controllers/health.controller';
import { HealthService } from './application/health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    fullCheck: jest.fn(),
    live: jest.fn(),
    ready: jest.fn(),
    checkDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return ok status when database is connected', async () => {
      mockHealthService.fullCheck.mockResolvedValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 100,
        version: '2.0.0',
        environment: 'test',
        database: { status: 'ok', latency: 1, message: 'Conexión exitosa' },
        system: {},
      });
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('database');
      expect(result.database.status).toBe('ok');
    });

    it('should return degraded status when database fails', async () => {
      mockHealthService.fullCheck.mockResolvedValue({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: { status: 'error', latency: 1, message: 'Error' },
        system: {},
      });
      const result = await controller.check();
      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('error');
    });
  });

  describe('GET /health/live', () => {
    it('should return ok status', () => {
      mockHealthService.live.mockReturnValue({ status: 'ok', timestamp: new Date().toISOString() });
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ok status when database is connected', async () => {
      mockHealthService.ready.mockResolvedValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: { status: 'ok' },
      });
      const result = await controller.ready();
      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('ok');
    });

    it('should return error status when database is down', async () => {
      mockHealthService.ready.mockResolvedValue({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: { status: 'error' },
      });
      const result = await controller.ready();
      expect(result.status).toBe('error');
      expect(result.database.status).toBe('error');
    });
  });
});
