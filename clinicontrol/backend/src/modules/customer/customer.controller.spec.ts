import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './infrastructure/controllers/customer.controller';
import { CustomerService } from './application/customer.service';

describe('CustomerController', () => {
  let controller: CustomerController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getContactInfos: jest.fn(),
    addContactInfo: jest.fn(),
    deleteContactInfo: jest.fn(),
    getAddresses: jest.fn(),
    addAddress: jest.fn(),
    deleteAddress: jest.fn(),
    getInteractions: jest.fn(),
    addInteraction: jest.fn(),
    completeInteraction: jest.fn(),
    deleteInteraction: jest.fn(),
    getTimeline: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [{ provide: CustomerService, useValue: mockService }],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      mockService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
      await controller.findAll(1, 10, 'test', 2);
      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'test',
        accountStatusId: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockService.findOne.mockResolvedValue({} as any);
      await controller.findOne('uuid-1');
      expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = { name: 'New Customer', company: 'ACME' };
      mockService.create.mockResolvedValue({} as any);
      await controller.create(dto as any);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { name: 'Updated' };
      mockService.update.mockResolvedValue({} as any);
      await controller.update('uuid-1', dto as any);
      expect(mockService.update).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      mockService.delete.mockResolvedValue(undefined);
      await controller.delete('uuid-1');
      expect(mockService.delete).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('getContactInfos', () => {
    it('should call service.getContactInfos', async () => {
      mockService.getContactInfos.mockResolvedValue([]);
      await controller.getContactInfos('uuid-1');
      expect(mockService.getContactInfos).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('addContactInfo', () => {
    it('should call service.addContactInfo', async () => {
      const dto = { contactType: 'email', value: 'test@test.com' };
      mockService.addContactInfo.mockResolvedValue({} as any);
      await controller.addContactInfo('uuid-1', dto as any);
      expect(mockService.addContactInfo).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('deleteContactInfo', () => {
    it('should call service.deleteContactInfo', async () => {
      mockService.deleteContactInfo.mockResolvedValue(undefined);
      await controller.deleteContactInfo('uuid-1', 'contact-id');
      expect(mockService.deleteContactInfo).toHaveBeenCalledWith(
        'uuid-1',
        'contact-id',
      );
    });
  });

  describe('getAddresses', () => {
    it('should call service.getAddresses', async () => {
      mockService.getAddresses.mockResolvedValue([]);
      await controller.getAddresses('uuid-1');
      expect(mockService.getAddresses).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('addAddress', () => {
    it('should call service.addAddress', async () => {
      const dto = {
        addressType: 'billing',
        street: 'Av. Principal',
        city: 'La Paz',
      };
      mockService.addAddress.mockResolvedValue({} as any);
      await controller.addAddress('uuid-1', dto as any);
      expect(mockService.addAddress).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('deleteAddress', () => {
    it('should call service.deleteAddress', async () => {
      mockService.deleteAddress.mockResolvedValue(undefined);
      await controller.deleteAddress('uuid-1', 'addr-id');
      expect(mockService.deleteAddress).toHaveBeenCalledWith(
        'uuid-1',
        'addr-id',
      );
    });
  });

  describe('getInteractions', () => {
    it('should call service.getInteractions with filters', async () => {
      mockService.getInteractions.mockResolvedValue([]);
      await controller.getInteractions('uuid-1', 'call', false);
      expect(mockService.getInteractions).toHaveBeenCalledWith('uuid-1', {
        type: 'call',
        completed: false,
      });
    });
  });

  describe('addInteraction', () => {
    it('should call service.addInteraction', async () => {
      const dto = { interactionType: 'call', subject: 'Test call' };
      mockService.addInteraction.mockResolvedValue({} as any);
      await controller.addInteraction('uuid-1', dto as any);
      expect(mockService.addInteraction).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('completeInteraction', () => {
    it('should call service.completeInteraction', async () => {
      mockService.completeInteraction.mockResolvedValue({} as any);
      await controller.completeInteraction('uuid-1', 'int-id');
      expect(mockService.completeInteraction).toHaveBeenCalledWith(
        'uuid-1',
        'int-id',
      );
    });
  });

  describe('deleteInteraction', () => {
    it('should call service.deleteInteraction', async () => {
      mockService.deleteInteraction.mockResolvedValue(undefined);
      await controller.deleteInteraction('uuid-1', 'int-id');
      expect(mockService.deleteInteraction).toHaveBeenCalledWith(
        'uuid-1',
        'int-id',
      );
    });
  });

  describe('getTimeline', () => {
    it('should call service.getTimeline', async () => {
      mockService.getTimeline.mockResolvedValue([]);
      await controller.getTimeline('uuid-1');
      expect(mockService.getTimeline).toHaveBeenCalledWith('uuid-1');
    });
  });
});
