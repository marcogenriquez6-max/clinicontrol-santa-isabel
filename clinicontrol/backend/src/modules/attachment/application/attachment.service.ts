import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AttachmentRepositoryPort } from '../domain/ports/attachment-repository.port';
import { AttachmentDomain } from '../domain/attachment.domain';
import { MinioService } from '../../../common/services/minio.service';
import * as path from 'path';
import * as crypto from 'crypto';
import { Readable } from 'stream';

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private readonly attachmentRepo: AttachmentRepositoryPort,
    private readonly minio: MinioService,
  ) {}

  private generateObjectName(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    const date = new Date().toISOString().slice(0, 10);
    return `${date}/${uuid}${ext}`;
  }

  private async generateThumbnail(
    buffer: Buffer,
    mimeType: string,
    objectName: string,
  ): Promise<string | null> {
    if (!mimeType.startsWith('image/')) return null;
    try {
      const sharp = await import('sharp');
      const thumbBuffer = await sharp
        .default(buffer)
        .resize(200, 200, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 70 })
        .toBuffer();
      const thumbName = `thumb/${objectName.replace(/\.[^.]+$/, '.jpg')}`;
      await this.minio.upload(
        undefined,
        thumbName,
        thumbBuffer,
        thumbBuffer.length,
        'image/jpeg',
      );
      return thumbName;
    } catch {
      this.logger.warn(
        'Thumbnail generation failed (sharp may not be available)',
      );
      return null;
    }
  }

  async upload(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIMES.includes(file.mimetype))
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    if (file.size > MAX_FILE_SIZE)
      throw new BadRequestException('File exceeds 10MB limit');

    const objectName = this.generateObjectName(file.originalname);
    await this.minio.upload(
      undefined,
      objectName,
      file.buffer,
      file.size,
      file.mimetype,
    );
    const thumbnailPath = await this.generateThumbnail(
      file.buffer,
      file.mimetype,
      objectName,
    );

    const attachment = await this.attachmentRepo.create({
      entityType,
      entityId,
      filename: objectName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: objectName,
      thumbnailPath,
    });

    this.logger.log(
      `File uploaded: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
    );
    return this.toResponse(attachment);
  }

  async findAll(entityType?: string, entityId?: string) {
    const attachments = await this.attachmentRepo.findAll(entityType, entityId);
    return Promise.all(attachments.map((a) => this.toResponse(a)));
  }

  async findOne(id: string) {
    const attachment = await this.attachmentRepo.findById(id);
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    return this.toResponse(attachment);
  }

  async getFile(
    id: string,
  ): Promise<{ stream: Readable; mimeType: string; filename: string }> {
    const attachment = await this.attachmentRepo.findById(id);
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    const stream = await this.minio.getStream(undefined, attachment.path!);
    return {
      stream,
      mimeType: attachment.mimeType!,
      filename: attachment.originalName!,
    };
  }

  async getThumbnail(
    id: string,
  ): Promise<{ stream: Readable; mimeType: string } | null> {
    const attachment = await this.attachmentRepo.findById(id);
    if (!attachment?.thumbnailPath) return null;
    const stream = await this.minio.getStream(
      undefined,
      attachment.thumbnailPath,
    );
    return { stream, mimeType: 'image/jpeg' };
  }

  async delete(id: string): Promise<void> {
    const attachment = await this.attachmentRepo.findById(id);
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    await this.minio.delete(undefined, attachment.path!);
    if (attachment.thumbnailPath)
      await this.minio
        .delete(undefined, attachment.thumbnailPath)
        .catch(() => {});
    await this.attachmentRepo.delete(id);
    this.logger.log(`File deleted: ${attachment.originalName}`);
  }

  private async toResponse(attachment: AttachmentDomain) {
    const url = await this.minio.getPresignedUrl(
      undefined,
      attachment.path!,
      3600,
    );
    let thumbnailUrl: string | undefined;
    if (attachment.thumbnailPath) {
      thumbnailUrl = await this.minio.getPresignedUrl(
        undefined,
        attachment.thumbnailPath,
        3600,
      );
    }
    return {
      id: attachment.id,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url,
      thumbnailUrl,
      createdAt: attachment.createdAt,
    };
  }
}
