import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GrupoSanguineoService } from './application/grupo-sanguineo.service';
import { GrupoSanguineoRepositoryPort } from './domain/ports/grupo-sanguineo-repository.port';
import { GrupoSanguineoDomain } from './domain/grupo-sanguineo.domain';

describe('GrupoSanguineoService', () => {
  let service: GrupoSanguineoService;
  let repo: jest.Mocked<GrupoSanguineoRepositoryPort>;

  const mockGrupo: GrupoSanguineoDomain = new GrupoSanguineoDomain(1, 'O+', true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrupoSanguineoService,
        {
          provide: GrupoSanguineoRepositoryPort,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GrupoSanguineoService>(GrupoSanguineoService);
    repo = module.get(GrupoSanguineoRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all grupos sanguineos', async () => {
      repo.findAll.mockResolvedValue([mockGrupo]);
      const result = await service.findAll();
      expect(result).toEqual([mockGrupo]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a grupo sanguineo by id', async () => {
      repo.findById.mockResolvedValue(mockGrupo);
      const result = await service.findOne(1);
      expect(result).toEqual(mockGrupo);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when grupo sanguineo not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
