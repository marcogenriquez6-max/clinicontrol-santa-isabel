import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AccountStatus } from './account-status.entity';
import { ContactInfo } from './contact-info.entity';
import { Address } from './address.entity';
import { Interaction } from './interaction.entity';

export enum CustomerTags {
  VIP = 'vip',
  PREMIUM = 'premium',
  REGULAR = 'regular',
  NEW = 'new',
}

@Entity('customer')
@Index('idx_customer_status', ['accountStatusId'])
@Index('idx_customer_name', ['name'])
@Index('idx_customer_company', ['company'])
@Index('idx_customer_created_at', ['createdAt'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ name: 'account_status_id', type: 'int', default: 3 })
  accountStatusId: number;

  @ManyToOne(() => AccountStatus, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_status_id' })
  accountStatus: AccountStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-json', default: '[]' })
  tags: string[];

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => ContactInfo, (contact) => contact.customer)
  contactInfos: ContactInfo[];

  @OneToMany(() => Address, (address) => address.customer)
  addresses: Address[];

  @OneToMany(() => Interaction, (interaction) => interaction.customer)
  interactions: Interaction[];
}
