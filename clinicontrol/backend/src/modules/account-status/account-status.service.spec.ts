import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatusService } from './application/account-status.service';
import { AccountStatusRepositoryPort } from './domain/ports/account-status-repository.port';
import {
  AccountStatusDomain,
  AccountStatusNameDomain,
} from './domain/account-status.domain';

describe('AccountStatusService', () => {
  let service: AccountStatusService;
  let repo: jest.Mocked<AccountStatusRepositoryPort>;

  const mockStatus: AccountStatusDomain = new AccountStatusDomain(
    1,
    AccountStatusNameDomain.ACTIVE,
    true,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountStatusService,
        {
          provide: AccountStatusRepositoryPort,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountStatusService>(AccountStatusService);
    repo = module.get(AccountStatusRepositoryPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all account statuses', async () => {
      repo.findAll.mockResolvedValue([mockStatus]);
      const result = await service.findAll();
      expect(result).toEqual([mockStatus]);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });
});
