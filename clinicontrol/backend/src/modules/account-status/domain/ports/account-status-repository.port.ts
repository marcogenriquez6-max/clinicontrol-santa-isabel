import { AccountStatusDomain } from '../account-status.domain';

export abstract class AccountStatusRepositoryPort {
  abstract findAll(): Promise<AccountStatusDomain[]>;
}
