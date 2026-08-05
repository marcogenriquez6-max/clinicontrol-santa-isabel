import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Customer } from './customer.entity';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  SOCIAL = 'social',
  LINK = 'link',
}

@Entity('contact_info')
@Index('idx_contact_customer', ['customerId'])
@Index('idx_contact_type', ['contactType'])
@Unique('contact_info_value_type', ['customerId', 'contactType', 'value'])
export class ContactInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (c) => c.contactInfos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'contact_type', type: 'varchar', enum: ContactType })
  contactType: ContactType;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
