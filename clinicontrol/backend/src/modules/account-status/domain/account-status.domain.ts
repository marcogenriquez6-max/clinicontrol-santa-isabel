export enum AccountStatusNameDomain {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  BLOCKED = 'blocked',
}

export class AccountStatusDomain {
  constructor(
    public readonly id?: number,
    public name: AccountStatusNameDomain = AccountStatusNameDomain.ACTIVE,
    public isActive = true,
  ) {}
}
