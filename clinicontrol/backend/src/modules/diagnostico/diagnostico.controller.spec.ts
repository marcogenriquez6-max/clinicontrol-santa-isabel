import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticoController } from './infrastructure/controllers/diagnostico.controller';
import { DiagnosticoService } from './application/diagnostico.service';

describe('DiagnosticoController', () => {
  let controller: DiagnosticoController;

  const mockDiagnostico = {
    id: 1,
    consultaId: 1,
    cie10Id: 1,
    codigo: 'I10',
    descripcion: 'Hipertensión esencial',
    tipo: 'principal',
    recomendaciones: 'Control mensual',
    esCronico: true,
  };

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByConsulta: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findCie10: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticoController],
      providers: [
        {
          provide: DiagnosticoService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DiagnosticoController>(DiagnosticoController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /diagnosticos', () => {
    it('should return all diagnosticos', async () => {
      mockService.findAll.mockResolvedValue([mockDiagnostico]);
      const result = await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockDiagnostico]);
    });
  });

  describe('GET /diagnosticos/cie10', () => {
    it('should search cie10 with query param', async () => {
      const cie10Results = [
        { id: 1, codigo: 'I10', descripcion: 'Hipertensión esencial' },
      ];
      mockService.findCie10.mockResolvedValue(cie10Results);
      const result = await controller.findCie10('hipert');
      expect(mockService.findCie10).toHaveBeenCalledWith('hipert');
      expect(result).toEqual(cie10Results);
    });

    it('should return all cie10 without query param', async () => {
      const cie10Results = [
        { id: 1, codigo: 'I10', descripcion: 'Hipertensión' },
        { id: 2, codigo: 'J45', descripcion: 'Asma' },
      ];
      mockService.findCie10.mockResolvedValue(cie10Results);
      const result = await controller.findCie10(undefined);
      expect(mockService.findCie10).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(cie10Results);
    });
  });

  describe('GET /diagnosticos/:id', () => {
    it('should return a diagnostico by id', async () => {
      mockService.findOne.mockResolvedValue(mockDiagnostico);
      const result = await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDiagnostico);
    });
  });

  describe('GET /diagnosticos/consulta/:consultaId', () => {
    it('should return diagnosticos by consulta id', async () => {
      mockService.findByConsulta.mockResolvedValue([mockDiagnostico]);
      const result = await controller.findByConsulta(1);
      expect(mockService.findByConsulta).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockDiagnostico]);
    });
  });

  describe('POST /diagnosticos', () => {
    it('should create a diagnostico', async () => {
      const createDto = {
        consultaId: 1,
        cie10Id: 1,
        descripcion: 'Hipertensión esencial',
      };
      mockService.create.mockResolvedValue(mockDiagnostico);
      const result = await controller.create(createDto);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockDiagnostico);
    });
  });

  describe('PUT /diagnosticos/:id', () => {
    it('should update a diagnostico', async () => {
      const updateDto = { descripcion: 'Actualizado' };
      const updated = { ...mockDiagnostico, ...updateDto };
      mockService.update.mockResolvedValue(updated);
      const result = await controller.update(1, updateDto);
      expect(mockService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updated);
    });
  });

  describe('DELETE /diagnosticos/:id', () => {
    it('should delete a diagnostico', async () => {
      mockService.delete.mockResolvedValue(undefined);
      const result = await controller.delete(1);
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
