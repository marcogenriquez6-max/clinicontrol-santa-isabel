import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GeneroService } from './application/genero.service';
import { GeneroRepositoryPort } from './domain/ports/genero-repository.port';
import { GeneroDomain } from './domain/genero.domain';

describe('GeneroService', () => {
  let service: GeneroService;
  let repo: jest.Mocked<GeneroRepositoryPort>;

  const mockGenero: GeneroDomain = new GeneroDomain(1, 'Masculino', true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneroService,
        {
          provide: GeneroRepositoryPort,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GeneroService>(GeneroService);
    repo = module.get(GeneroRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all generos', async () => {
      repo.findAll.mockResolvedValue([mockGenero]);
      const result = await service.findAll();
      expect(result).toEqual([mockGenero]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a genero by id', async () => {
      repo.findById.mockResolvedValue(mockGenero);
      const result = await service.findOne(1);
      expect(result).toEqual(mockGenero);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when genero not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
