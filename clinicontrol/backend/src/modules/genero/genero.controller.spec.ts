import { Test, TestingModule } from '@nestjs/testing';
import { GeneroController } from './infrastructure/controllers/genero.controller';
import { GeneroService } from './application/genero.service';

describe('GeneroController', () => {
  let controller: GeneroController;

  const mockGeneroService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneroController],
      providers: [{ provide: GeneroService, useValue: mockGeneroService }],
    }).compile();

    controller = module.get<GeneroController>(GeneroController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /', () => {
    it('should return all generos', async () => {
      const expected = [{ id: 1, nombre: 'Masculino' }];
      mockGeneroService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockGeneroService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should return a genero by id', async () => {
      const expected = { id: 1, nombre: 'Masculino' };
      mockGeneroService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockGeneroService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
