import {
  CustomerDomain,
  ContactInfoDomain,
  AddressDomain,
  InteractionDomain,
} from '../customer.domain';

export abstract class CustomerRepositoryPort {
  abstract findAll(filters: any): Promise<{
    data: CustomerDomain[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  abstract findOne(id: string): Promise<CustomerDomain | null>;
  abstract create(data: Partial<CustomerDomain>): Promise<CustomerDomain>;
  abstract update(
    id: string,
    data: Partial<CustomerDomain>,
  ): Promise<CustomerDomain | null>;
  abstract delete(id: string): Promise<void>;
  abstract getContactInfos(customerId: string): Promise<ContactInfoDomain[]>;
  abstract addContactInfo(
    customerId: string,
    data: Partial<ContactInfoDomain>,
  ): Promise<ContactInfoDomain>;
  abstract deleteContactInfo(
    customerId: string,
    contactId: string,
  ): Promise<void>;
  abstract getAddresses(customerId: string): Promise<AddressDomain[]>;
  abstract addAddress(
    customerId: string,
    data: Partial<AddressDomain>,
  ): Promise<AddressDomain>;
  abstract deleteAddress(customerId: string, addressId: string): Promise<void>;
  abstract getInteractions(
    customerId: string,
    filters?: any,
  ): Promise<InteractionDomain[]>;
  abstract addInteraction(
    customerId: string,
    data: Partial<InteractionDomain>,
  ): Promise<InteractionDomain>;
  abstract completeInteraction(
    customerId: string,
    interactionId: string,
  ): Promise<InteractionDomain>;
  abstract deleteInteraction(
    customerId: string,
    interactionId: string,
  ): Promise<void>;
}
