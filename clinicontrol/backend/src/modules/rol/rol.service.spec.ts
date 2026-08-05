import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolService } from './application/rol.service';
import { RolRepositoryPort } from './domain/ports/rol-repository.port';
import { RolDomain } from './domain/rol.domain';

describe('RolService', () => {
  let service: RolService;
  let repo: jest.Mocked<RolRepositoryPort>;

  const mockRol: RolDomain = new RolDomain(1, 'Admin', true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolService,
        {
          provide: RolRepositoryPort,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RolService>(RolService);
    repo = module.get(RolRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      repo.findAll.mockResolvedValue([mockRol]);
      const result = await service.findAll();
      expect(result).toEqual([mockRol]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a rol by id', async () => {
      repo.findById.mockResolvedValue(mockRol);
      const result = await service.findOne(1);
      expect(result).toEqual(mockRol);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when rol not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
