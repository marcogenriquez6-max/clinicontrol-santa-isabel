import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioController } from './infrastructure/controllers/usuario.controller';
import { UsuarioService } from './application/usuario.service';

describe('UsuarioController', () => {
  let controller: UsuarioController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [{ provide: UsuarioService, useValue: mockService }],
    }).compile();

    controller = module.get<UsuarioController>(UsuarioController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockService.findAll.mockResolvedValue([]);
      await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockService.findOne.mockResolvedValue({} as any);
      await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = {
        nombre: 'Test',
        apellido: 'User',
        email: 'test@test.com',
        password: 'Pass123!',
      };
      mockService.create.mockResolvedValue({} as any);
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { nombre: 'Updated' };
      mockService.update.mockResolvedValue({} as any);
      await controller.update(1, dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      mockService.delete.mockResolvedValue(undefined);
      await controller.delete(1);
      expect(mockService.delete).toHaveBeenCalledWith(1);
    });
  });
});
