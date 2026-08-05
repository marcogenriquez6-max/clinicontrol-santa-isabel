import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EstadoCitaService } from './application/estado-cita.service';
import { EstadoCitaRepositoryPort } from './domain/ports/estado-cita-repository.port';
import { EstadoCitaDomain } from './domain/estado-cita.domain';

describe('EstadoCitaService', () => {
  let service: EstadoCitaService;
  let repo: jest.Mocked<EstadoCitaRepositoryPort>;

  const mockEstado: EstadoCitaDomain = new EstadoCitaDomain(1, 'Pendiente', true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadoCitaService,
        {
          provide: EstadoCitaRepositoryPort,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EstadoCitaService>(EstadoCitaService);
    repo = module.get(EstadoCitaRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all estados de cita', async () => {
      repo.findAll.mockResolvedValue([mockEstado]);
      const result = await service.findAll();
      expect(result).toEqual([mockEstado]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an estado de cita by id', async () => {
      repo.findById.mockResolvedValue(mockEstado);
      const result = await service.findOne(1);
      expect(result).toEqual(mockEstado);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when estado de cita not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
