export class CustomerDomain {
  constructor(
    public readonly id?: string,
    public name?: string,
    public company?: string,
    public accountStatusId = 3,
    public notes?: string,
    public tags: string[] = [],
    public createdBy?: string,
    public updatedBy?: string,
    public metadata?: Record<string, any>,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date,
  ) {}
}

export class ContactInfoDomain {
  constructor(
    public readonly id?: string,
    public customerId?: string,
    public contactType?: string,
    public value?: string,
    public isPrimary = false,
    public verifiedAt?: Date,
    public createdAt?: Date,
  ) {}
}

export class AddressDomain {
  constructor(
    public readonly id?: string,
    public customerId?: string,
    public addressType?: string,
    public street?: string,
    public city?: string,
    public state?: string,
    public zipCode?: string,
    public country?: string,
    public isDefault = false,
    public createdAt?: Date,
  ) {}
}

export class InteractionDomain {
  constructor(
    public readonly id?: string,
    public customerId?: string,
    public interactionType?: string,
    public subject?: string,
    public content?: string,
    public direction?: string,
    public relatedToId?: string,
    public relatedToType?: string,
    public dueDate?: string,
    public priority?: string,
    public completedAt?: Date,
    public createdAt?: Date,
  ) {}
}
