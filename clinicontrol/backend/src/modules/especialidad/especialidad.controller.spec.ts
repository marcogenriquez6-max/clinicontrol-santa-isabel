import { Test, TestingModule } from '@nestjs/testing';
import { EspecialidadController } from './infrastructure/controllers/especialidad.controller';
import { EspecialidadService } from './application/especialidad.service';

describe('EspecialidadController', () => {
  let controller: EspecialidadController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EspecialidadController],
      providers: [{ provide: EspecialidadService, useValue: mockService }],
    }).compile();

    controller = module.get<EspecialidadController>(EspecialidadController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /', () => {
    it('should return all especialidades', async () => {
      const expected = [{ id: 1, nombre: 'Cardiología' }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should return an especialidad by id', async () => {
      const expected = { id: 1, nombre: 'Cardiología' };
      mockService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /', () => {
    it('should create a new especialidad', async () => {
      const dto = { nombre: 'Cardiología' };
      const expected = { id: 1, ...dto };
      mockService.create.mockResolvedValue(expected);
      const result = await controller.create(dto as any);
      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('PUT /:id', () => {
    it('should update an especialidad', async () => {
      const dto = { nombre: 'Neurología' };
      const expected = { id: 1, nombre: 'Neurología' };
      mockService.update.mockResolvedValue(expected);
      const result = await controller.update(1, dto as any);
      expect(result).toEqual(expected);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete an especialidad', async () => {
      mockService.delete.mockResolvedValue(undefined);
      await controller.delete(1);
      expect(mockService.delete).toHaveBeenCalledWith(1);
    });
  });
});
