import { Test, TestingModule } from '@nestjs/testing';
import { GrupoSanguineoController } from './infrastructure/controllers/grupo-sanguineo.controller';
import { GrupoSanguineoService } from './application/grupo-sanguineo.service';

describe('GrupoSanguineoController', () => {
  let controller: GrupoSanguineoController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrupoSanguineoController],
      providers: [{ provide: GrupoSanguineoService, useValue: mockService }],
    }).compile();

    controller = module.get<GrupoSanguineoController>(GrupoSanguineoController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /', () => {
    it('should return all grupos sanguineos', async () => {
      const expected = [{ id: 1, nombre: 'O+' }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should return a grupo sanguineo by id', async () => {
      const expected = { id: 1, nombre: 'O+' };
      mockService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
