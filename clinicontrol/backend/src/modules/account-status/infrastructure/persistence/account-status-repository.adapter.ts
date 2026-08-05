import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountStatusRepositoryPort } from '../../domain/ports/account-status-repository.port';
import { AccountStatusDomain } from '../../domain/account-status.domain';
import { AccountStatus } from '../../../../entities/account-status.entity';

@Injectable()
export class AccountStatusRepositoryAdapter extends AccountStatusRepositoryPort {
  constructor(
    @InjectRepository(AccountStatus)
    private readonly repo: Repository<AccountStatus>,
  ) {
    super();
  }

  private toDomain(entity: AccountStatus): AccountStatusDomain {
    return new AccountStatusDomain(
      entity.id,
      entity.name as any,
      entity.isActive,
    );
  }

  async findAll(): Promise<AccountStatusDomain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }
}
