import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountStatusController } from './controllers/account-status.controller';
import { AccountStatusService } from '../application/account-status.service';
import { AccountStatusRepositoryPort } from '../domain/ports/account-status-repository.port';
import { AccountStatusRepositoryAdapter } from './persistence/account-status-repository.adapter';
import { AccountStatus } from '../../../entities/account-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountStatus])],
  controllers: [AccountStatusController],
  providers: [
    AccountStatusService,
    {
      provide: AccountStatusRepositoryPort,
      useClass: AccountStatusRepositoryAdapter,
    },
  ],
  exports: [AccountStatusService, AccountStatusRepositoryPort],
})
export class AccountStatusModule {}
