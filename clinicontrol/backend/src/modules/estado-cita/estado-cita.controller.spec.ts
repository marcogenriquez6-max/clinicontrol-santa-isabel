import { Test, TestingModule } from '@nestjs/testing';
import { EstadoCitaController } from './infrastructure/controllers/estado-cita.controller';
import { EstadoCitaService } from './application/estado-cita.service';

describe('EstadoCitaController', () => {
  let controller: EstadoCitaController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadoCitaController],
      providers: [{ provide: EstadoCitaService, useValue: mockService }],
    }).compile();

    controller = module.get<EstadoCitaController>(EstadoCitaController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /', () => {
    it('should return all estados de cita', async () => {
      const expected = [{ id: 1, nombre: 'Pendiente' }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should return an estado de cita by id', async () => {
      const expected = { id: 1, nombre: 'Pendiente' };
      mockService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
