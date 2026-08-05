import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum AccountStatusName {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  BLOCKED = 'blocked',
}

@Entity('account_status')
@Index('idx_account_status_name', ['name'])
export class AccountStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: AccountStatusName;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
