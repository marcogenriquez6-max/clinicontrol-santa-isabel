import { Injectable } from '@nestjs/common';
import { AccountStatusRepositoryPort } from '../domain/ports/account-status-repository.port';
import { AccountStatusDomain } from '../domain/account-status.domain';

@Injectable()
export class AccountStatusService {
  constructor(
    private readonly accountStatusRepo: AccountStatusRepositoryPort,
  ) {}

  async findAll(): Promise<AccountStatusDomain[]> {
    return this.accountStatusRepo.findAll();
  }
}
