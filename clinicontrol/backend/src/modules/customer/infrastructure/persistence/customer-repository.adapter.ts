import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CustomerRepositoryPort } from '../../domain/ports/customer-repository.port';
import {
  CustomerDomain,
  ContactInfoDomain,
  AddressDomain,
  InteractionDomain,
} from '../../domain/customer.domain';
import { Customer } from '../../../../entities/customer.entity';
import { ContactInfo } from '../../../../entities/contact-info.entity';
import { Address } from '../../../../entities/address.entity';
import { Interaction } from '../../../../entities/interaction.entity';

@Injectable()
export class CustomerRepositoryAdapter extends CustomerRepositoryPort {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(ContactInfo)
    private contactInfoRepo: Repository<ContactInfo>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
    @InjectRepository(Interaction)
    private interactionRepo: Repository<Interaction>,
  ) {
    super();
  }

  private customerToDomain(e: Customer): CustomerDomain {
    return new CustomerDomain(
      e.id,
      e.name,
      e.company,
      e.accountStatusId,
      e.notes,
      e.tags,
      e.createdBy,
      e.updatedBy,
      e.metadata,
      e.createdAt,
      e.updatedAt,
      e.deletedAt,
    );
  }

  private contactToDomain(e: ContactInfo): ContactInfoDomain {
    return new ContactInfoDomain(
      e.id,
      e.customerId,
      e.contactType,
      e.value,
      e.isPrimary,
      e.verifiedAt,
      e.createdAt,
    );
  }

  private addressToDomain(e: Address): AddressDomain {
    return new AddressDomain(
      e.id,
      e.customerId,
      e.addressType,
      e.street,
      e.city,
      e.state,
      e.zipCode,
      e.country,
      e.isDefault,
      e.createdAt,
    );
  }

  private interactionToDomain(e: Interaction): InteractionDomain {
    return new InteractionDomain(
      e.id,
      e.customerId,
      e.interactionType,
      e.subject,
      e.content,
      e.direction,
      e.relatedToId,
      e.relatedToType,
      e.dueDate as any,
      e.priority,
      e.completedAt,
      e.createdAt,
    );
  }

  async findAll(filters: any): Promise<{
    data: CustomerDomain[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      accountStatusId,
    } = filters;
    const where: any = {};
    if (search) where.name = ILike(`%${search}%`);
    if (accountStatusId) where.accountStatusId = accountStatusId;

    const [data, total] = await this.customerRepo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['accountStatus'],
    });

    return {
      data: data.map((e) => this.customerToDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CustomerDomain | null> {
    const e = await this.customerRepo.findOne({
      where: { id },
      relations: ['accountStatus', 'interactions', 'contactInfos', 'addresses'],
    });
    return e ? this.customerToDomain(e) : null;
  }

  async create(data: Partial<CustomerDomain>): Promise<CustomerDomain> {
    const entity = this.customerRepo.create(data as any);
    const saved = await this.customerRepo.save(entity);
    return this.customerToDomain(saved as any);
  }

  async update(
    id: string,
    data: Partial<CustomerDomain>,
  ): Promise<CustomerDomain | null> {
    await this.customerRepo.update(id, data as any);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.customerRepo.softDelete(id);
  }

  async getContactInfos(customerId: string): Promise<ContactInfoDomain[]> {
    const entities = await this.contactInfoRepo.find({
      where: { customerId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
    return entities.map((e) => this.contactToDomain(e));
  }

  async addContactInfo(
    customerId: string,
    data: Partial<ContactInfoDomain>,
  ): Promise<ContactInfoDomain> {
    if (data.isPrimary) {
      await this.contactInfoRepo.update(
        { customerId, isPrimary: true },
        { isPrimary: false },
      );
    }
    const entity = this.contactInfoRepo.create({ ...data, customerId } as any);
    const saved = await this.contactInfoRepo.save(entity);
    return this.contactToDomain(saved as any);
  }

  async deleteContactInfo(
    customerId: string,
    contactId: string,
  ): Promise<void> {
    await this.contactInfoRepo.softDelete(contactId);
  }

  async getAddresses(customerId: string): Promise<AddressDomain[]> {
    const entities = await this.addressRepo.find({
      where: { customerId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    return entities.map((e) => this.addressToDomain(e));
  }

  async addAddress(
    customerId: string,
    data: Partial<AddressDomain>,
  ): Promise<AddressDomain> {
    if (data.isDefault) {
      await this.addressRepo.update(
        { customerId, isDefault: true },
        { isDefault: false },
      );
    }
    const entity = this.addressRepo.create({ ...data, customerId } as any);
    const saved = await this.addressRepo.save(entity);
    return this.addressToDomain(saved as any);
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    await this.addressRepo.softDelete(addressId);
  }

  async getInteractions(
    customerId: string,
    filters?: any,
  ): Promise<InteractionDomain[]> {
    const where: any = { customerId, ...filters };
    const entities = await this.interactionRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.interactionToDomain(e));
  }

  async addInteraction(
    customerId: string,
    data: Partial<InteractionDomain>,
  ): Promise<InteractionDomain> {
    const entity = this.interactionRepo.create({ ...data, customerId } as any);
    const saved = await this.interactionRepo.save(entity);
    return this.interactionToDomain(saved as any);
  }

  async completeInteraction(
    customerId: string,
    interactionId: string,
  ): Promise<InteractionDomain> {
    await this.interactionRepo.update(interactionId, {
      completedAt: new Date(),
    });
    const e = await this.interactionRepo.findOne({
      where: { id: interactionId },
    });
    return this.interactionToDomain(e!);
  }

  async deleteInteraction(
    customerId: string,
    interactionId: string,
  ): Promise<void> {
    await this.interactionRepo.softDelete(interactionId);
  }
}
