import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AuditRepositoryPort,
  AuditLogParams,
  AuditQuery,
} from '../../domain/ports/audit-repository.port';
import { AuditDomain, AuditActionDomain } from '../../domain/audit.domain';
import { AuditLog } from '../../../../entities/audit-log.entity';

@Injectable()
export class AuditRepositoryAdapter extends AuditRepositoryPort {
  private readonly logger = new Logger(AuditRepositoryAdapter.name);
  private readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'mfa_secret',
    'refresh_token',
    'access_token',
    'authorization',
  ];

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {
    super();
  }

  private toDomain(e: AuditLog): AuditDomain {
    return new AuditDomain(
      e.id,
      e.userId,
      e.userEmail,
      e.action as unknown as AuditActionDomain,
      e.entityType,
      e.entityId,
      e.oldValue,
      e.newValue,
      e.changes,
      e.ipAddress,
      e.userAgent,
      e.sessionId,
      e.createdAt,
    );
  }

  private sanitize(
    data: Record<string, any> | undefined,
  ): Record<string, any> | undefined {
    if (!data) return data;
    const sanitized = { ...data };
    for (const field of this.SENSITIVE_FIELDS) {
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
  }

  async log(params: AuditLogParams): Promise<AuditDomain> {
    const entry = this.repo.create({
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action as any,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: this.sanitize(params.oldValue),
      newValue: this.sanitize(params.newValue),
      changes: params.changes ? this.sanitize(params.changes) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
    } as any);
    const saved = await this.repo.save(entry);
    this.logger.log(
      `[AUDIT] ${params.action} on ${params.entityType}:${params.entityId} by ${params.userId}`,
    );
    return this.toDomain(saved as any);
  }

  async query(query: AuditQuery) {
    const {
      entityType,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate && endDate) where.createdAt = Between(startDate, endDate);

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data: data.map((e) => this.toDomain(e)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditDomain[]> {
    const entities = await this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async getUserActivity(userId: string, limit = 20): Promise<AuditDomain[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }
}
