import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatusController } from './infrastructure/controllers/account-status.controller';
import { AccountStatusService } from './application/account-status.service';

describe('AccountStatusController', () => {
  let controller: AccountStatusController;

  const mockService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountStatusController],
      providers: [{ provide: AccountStatusService, useValue: mockService }],
    }).compile();

    controller = module.get<AccountStatusController>(AccountStatusController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /account-status', () => {
    it('should return all account statuses', async () => {
      const expected = [{ id: 1, name: 'active', isActive: true }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });
});
