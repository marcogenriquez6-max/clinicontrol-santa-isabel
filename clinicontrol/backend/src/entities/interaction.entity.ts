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
} from 'typeorm';
import { Customer } from './customer.entity';

export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
  TASK = 'task',
  REMINDER = 'reminder',
}

export enum InteractionDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum InteractionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('interaction')
@Index('idx_interaction_customer', ['customerId'])
@Index('idx_interaction_user', ['userId'])
@Index('idx_interaction_type', ['interactionType'])
@Index('idx_interaction_due', ['dueDate'])
export class Interaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (c) => c.interactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'interaction_type', type: 'varchar', enum: InteractionType })
  interactionType: InteractionType;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', enum: InteractionDirection, nullable: true })
  direction: InteractionDirection;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'related_to_id', type: 'uuid', nullable: true })
  relatedToId: string;

  @Column({
    name: 'related_to_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  relatedToType: string;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({
    type: 'varchar',
    enum: InteractionPriority,
    default: InteractionPriority.NORMAL,
  })
  priority: InteractionPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
