import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentRepositoryPort } from '../../domain/ports/attachment-repository.port';
import { AttachmentDomain } from '../../domain/attachment.domain';
import { Attachment } from '../../../../entities/attachment.entity';

@Injectable()
export class AttachmentRepositoryAdapter extends AttachmentRepositoryPort {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {
    super();
  }

  private toDomain(e: Attachment): AttachmentDomain {
    return new AttachmentDomain(
      e.id,
      e.entityType,
      e.entityId,
      e.filename,
      e.originalName,
      e.mimeType,
      Number(e.size),
      e.path,
      e.thumbnailPath,
      e.uploadedBy,
      e.createdAt,
      e.deletedAt,
    );
  }

  async findAll(
    entityType?: string,
    entityId?: string,
  ): Promise<AttachmentDomain[]> {
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    const entities = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<AttachmentDomain | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toDomain(e) : null;
  }

  async create(data: Partial<AttachmentDomain>): Promise<AttachmentDomain> {
    const entity = this.repo.create(data as any);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved as any);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
