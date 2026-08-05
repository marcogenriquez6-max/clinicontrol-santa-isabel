import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerService } from './application/customer.service';
import { CustomerRepositoryPort } from './domain/ports/customer-repository.port';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepo: jest.Mocked<CustomerRepositoryPort>;

  const mockCustomer: any = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Customer',
    company: 'Test Company',
    accountStatusId: 1,
    notes: 'Test notes',
    tags: ['vip'],
    createdBy: '1',
    updatedBy: '1',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    accountStatus: { id: 1, name: 'Activo', isActive: true },
    contactInfos: [],
    addresses: [],
    interactions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CustomerRepositoryPort,
          useValue: {
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
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepo = module.get(CustomerRepositoryPort);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      customerRepo.findAll.mockResolvedValue({
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
    });

    it('should apply search filter', async () => {
      customerRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(customerRepo.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'test',
      });
    });

    it('should apply status filter', async () => {
      customerRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await service.findAll({ page: 1, limit: 10, accountStatusId: 1 });

      expect(customerRepo.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        accountStatusId: 1,
      });
    });

    it('should apply sort order', async () => {
      customerRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(customerRepo.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      });
    });
  });

  describe('findOne', () => {
    it('should return customer if found', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockCustomer.id);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      customerRepo.create.mockResolvedValue(mockCustomer);

      const result = await service.create({ name: 'Test Customer' });

      expect(customerRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('update', () => {
    it('should update an existing customer', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Updated Name' };
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.update.mockResolvedValue(updatedCustomer);

      await service.update(mockCustomer.id, { name: 'Updated Name' });

      expect(customerRepo.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete customer', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.delete.mockResolvedValue(undefined);

      await service.delete(mockCustomer.id);

      expect(customerRepo.delete).toHaveBeenCalledWith(mockCustomer.id);
    });
  });

  describe('getContactInfos', () => {
    it('should return contact infos', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.getContactInfos.mockResolvedValue([]);

      await service.getContactInfos(mockCustomer.id);

      expect(customerRepo.getContactInfos).toHaveBeenCalledWith(
        mockCustomer.id,
      );
    });
  });

  describe('addContactInfo', () => {
    it('should add contact info to customer', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.addContactInfo.mockResolvedValue({} as any);

      await service.addContactInfo(mockCustomer.id, {
        contactType: 'email',
        value: 'test@test.com',
      });

      expect(customerRepo.addContactInfo).toHaveBeenCalled();
    });

    it('should unset previous primary when new is primary', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.addContactInfo.mockResolvedValue({} as any);

      await service.addContactInfo(mockCustomer.id, {
        contactType: 'email',
        value: 'new@test.com',
        isPrimary: true,
      });

      expect(customerRepo.addContactInfo).toHaveBeenCalledWith(
        mockCustomer.id,
        {
          contactType: 'email',
          value: 'new@test.com',
          isPrimary: true,
        },
      );
    });
  });

  describe('deleteContactInfo', () => {
    it('should soft delete contact', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.deleteContactInfo.mockResolvedValue(undefined);

      await service.deleteContactInfo(mockCustomer.id, 'contact-id');

      expect(customerRepo.deleteContactInfo).toHaveBeenCalledWith(
        mockCustomer.id,
        'contact-id',
      );
    });
  });

  describe('getAddresses', () => {
    it('should return addresses', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.getAddresses.mockResolvedValue([]);

      await service.getAddresses(mockCustomer.id);

      expect(customerRepo.getAddresses).toHaveBeenCalledWith(mockCustomer.id);
    });
  });

  describe('addAddress', () => {
    it('should add address', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.addAddress.mockResolvedValue({} as any);

      await service.addAddress(mockCustomer.id, {
        addressType: 'billing',
        street: 'Av. Principal',
        city: 'La Paz',
      });

      expect(customerRepo.addAddress).toHaveBeenCalled();
    });

    it('should unset default when new is default', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.addAddress.mockResolvedValue({} as any);

      await service.addAddress(mockCustomer.id, {
        addressType: 'billing',
        street: 'New St',
        city: 'City',
        isDefault: true,
      });

      expect(customerRepo.addAddress).toHaveBeenCalledWith(mockCustomer.id, {
        addressType: 'billing',
        street: 'New St',
        city: 'City',
        isDefault: true,
      });
    });
  });

  describe('deleteAddress', () => {
    it('should soft delete address', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.deleteAddress.mockResolvedValue(undefined);

      await service.deleteAddress(mockCustomer.id, 'addr-id');
      expect(customerRepo.deleteAddress).toHaveBeenCalledWith(
        mockCustomer.id,
        'addr-id',
      );
    });
  });

  describe('getInteractions', () => {
    it('should return interactions with filters', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.getInteractions.mockResolvedValue([]);

      await service.getInteractions(mockCustomer.id, { type: 'call' });

      expect(customerRepo.getInteractions).toHaveBeenCalledWith(
        mockCustomer.id,
        { type: 'call' },
      );
    });
  });

  describe('addInteraction', () => {
    it('should add interaction', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.addInteraction.mockResolvedValue({} as any);

      await service.addInteraction(mockCustomer.id, {
        interactionType: 'call',
        subject: 'Test',
      });

      expect(customerRepo.addInteraction).toHaveBeenCalled();
    });
  });

  describe('completeInteraction', () => {
    it('should complete interaction', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.completeInteraction.mockResolvedValue({
        id: 'int-id',
        completedAt: new Date(),
      } as any);

      await service.completeInteraction(mockCustomer.id, 'int-id');

      expect(customerRepo.completeInteraction).toHaveBeenCalledWith(
        mockCustomer.id,
        'int-id',
      );
    });
  });

  describe('deleteInteraction', () => {
    it('should soft delete interaction', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      customerRepo.deleteInteraction.mockResolvedValue(undefined);

      await service.deleteInteraction(mockCustomer.id, 'int-id');
      expect(customerRepo.deleteInteraction).toHaveBeenCalledWith(
        mockCustomer.id,
        'int-id',
      );
    });
  });

  describe('getTimeline', () => {
    it('should return timeline with interactions', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      const mockInteractions = [{ id: 'int-1', interactionType: 'call' }];
      customerRepo.getInteractions.mockResolvedValue(mockInteractions as any);

      const result = await service.getTimeline(mockCustomer.id);

      expect(result).toEqual([
        { type: 'interaction', data: mockInteractions[0] },
      ]);
    });
  });
});
