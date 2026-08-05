import { Test, TestingModule } from '@nestjs/testing';
import { RolController } from './infrastructure/controllers/rol.controller';
import { RolService } from './application/rol.service';

describe('RolController', () => {
  let controller: RolController;

  const mockRolService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolController],
      providers: [{ provide: RolService, useValue: mockRolService }],
    }).compile();

    controller = module.get<RolController>(RolController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /', () => {
    it('should return all roles', async () => {
      const expected = [{ id: 1, nombre: 'Admin' }];
      mockRolService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockRolService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should return a rol by id', async () => {
      const expected = { id: 1, nombre: 'Admin' };
      mockRolService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockRolService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
