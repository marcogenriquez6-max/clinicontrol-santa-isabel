import { AttachmentDomain } from '../attachment.domain';

export abstract class AttachmentRepositoryPort {
  abstract findAll(
    entityType?: string,
    entityId?: string,
  ): Promise<AttachmentDomain[]>;
  abstract findById(id: string): Promise<AttachmentDomain | null>;
  abstract create(data: Partial<AttachmentDomain>): Promise<AttachmentDomain>;
  abstract delete(id: string): Promise<void>;
}
