import { Test, TestingModule } from '@nestjs/testing';
import { MedicoController } from './infrastructure/controllers/medico.controller';
import { MedicoService } from './application/medico.service';

describe('MedicoController', () => {
  let controller: MedicoController;

  const mockMedico = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    especialidadId: 1,
    telefono: '12345678',
    email: 'juan@hospital.com',
  };

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEspecialidad: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicoController],
      providers: [
        {
          provide: MedicoService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MedicoController>(MedicoController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /medicos', () => {
    it('should return all medicos', async () => {
      mockService.findAll.mockResolvedValue([mockMedico]);
      const result = await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMedico]);
    });
  });

  describe('GET /medicos/especialidad/:id', () => {
    it('should return medicos by especialidad', async () => {
      mockService.findByEspecialidad.mockResolvedValue([mockMedico]);
      const result = await controller.findByEspecialidad(1);
      expect(mockService.findByEspecialidad).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockMedico]);
    });
  });

  describe('GET /medicos/:id', () => {
    it('should return a medico by id', async () => {
      mockService.findOne.mockResolvedValue(mockMedico);
      const result = await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMedico);
    });
  });

  describe('POST /medicos', () => {
    it('should create a medico', async () => {
      const createDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        especialidadId: 1,
      };
      mockService.create.mockResolvedValue(mockMedico);
      const result = await controller.create(createDto);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMedico);
    });
  });

  describe('PUT /medicos/:id', () => {
    it('should update a medico', async () => {
      const updateDto = { nombre: 'Juan Updated' };
      const updated = { ...mockMedico, ...updateDto };
      mockService.update.mockResolvedValue(updated);
      const result = await controller.update(1, updateDto);
      expect(mockService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updated);
    });
  });

  describe('DELETE /medicos/:id', () => {
    it('should delete a medico', async () => {
      mockService.delete.mockResolvedValue(undefined);
      const result = await controller.delete(1);
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
