import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepositoryPort } from '../domain/ports/customer-repository.port';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateContactInfoDto,
  CreateAddressDto,
  CreateInteractionDto,
} from '../infrastructure/dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepositoryPort) {}

  async findAll(filters: any) {
    return this.customerRepo.findAll(filters);
  }

  async findOne(id: string) {
    const customer = await this.customerRepo.findOne(id);
    if (!customer) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    return this.customerRepo.create(dto as any);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.customerRepo.update(id, dto as any);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.customerRepo.delete(id);
  }

  async getContactInfos(customerId: string) {
    await this.findOne(customerId);
    return this.customerRepo.getContactInfos(customerId);
  }

  async addContactInfo(customerId: string, dto: CreateContactInfoDto) {
    await this.findOne(customerId);
    return this.customerRepo.addContactInfo(customerId, dto as any);
  }

  async deleteContactInfo(customerId: string, contactId: string) {
    await this.findOne(customerId);
    await this.customerRepo.deleteContactInfo(customerId, contactId);
  }

  async getAddresses(customerId: string) {
    await this.findOne(customerId);
    return this.customerRepo.getAddresses(customerId);
  }

  async addAddress(customerId: string, dto: CreateAddressDto) {
    await this.findOne(customerId);
    return this.customerRepo.addAddress(customerId, dto as any);
  }

  async deleteAddress(customerId: string, addressId: string) {
    await this.findOne(customerId);
    await this.customerRepo.deleteAddress(customerId, addressId);
  }

  async getInteractions(customerId: string, filters?: any) {
    await this.findOne(customerId);
    return this.customerRepo.getInteractions(customerId, filters);
  }

  async addInteraction(customerId: string, dto: CreateInteractionDto) {
    await this.findOne(customerId);
    return this.customerRepo.addInteraction(customerId, dto as any);
  }

  async completeInteraction(customerId: string, interactionId: string) {
    await this.findOne(customerId);
    return this.customerRepo.completeInteraction(customerId, interactionId);
  }

  async deleteInteraction(customerId: string, interactionId: string) {
    await this.findOne(customerId);
    await this.customerRepo.deleteInteraction(customerId, interactionId);
  }

  async getTimeline(customerId: string) {
    await this.findOne(customerId);
    const interactions = await this.customerRepo.getInteractions(customerId);
    return interactions.map((i) => ({ type: 'interaction', data: i }));
  }
}
