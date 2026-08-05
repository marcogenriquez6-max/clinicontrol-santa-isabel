import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from '../application/customer.service';
import { CustomerRepositoryPort } from '../domain/ports/customer-repository.port';
import { CustomerRepositoryAdapter } from './persistence/customer-repository.adapter';
import { Customer } from '../../../entities/customer.entity';
import { ContactInfo } from '../../../entities/contact-info.entity';
import { Address } from '../../../entities/address.entity';
import { Interaction } from '../../../entities/interaction.entity';
import { AccountStatus } from '../../../entities/account-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      ContactInfo,
      Address,
      Interaction,
      AccountStatus,
    ]),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    { provide: CustomerRepositoryPort, useClass: CustomerRepositoryAdapter },
  ],
  exports: [CustomerService, CustomerRepositoryPort],
})
export class CustomerModule {}
