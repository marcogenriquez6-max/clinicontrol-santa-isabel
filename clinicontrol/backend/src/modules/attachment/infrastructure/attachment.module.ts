import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AttachmentController } from './controllers/attachment.controller';
import { AttachmentService } from '../application/attachment.service';
import { Attachment } from '../../../entities/attachment.entity';
import { MinioService } from '../../../common/services/minio.service';
import { AttachmentRepositoryPort } from '../domain/ports/attachment-repository.port';
import { AttachmentRepositoryAdapter } from './persistence/attachment-repository.adapter';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    MinioService,
    {
      provide: AttachmentRepositoryPort,
      useClass: AttachmentRepositoryAdapter,
    },
  ],
  exports: [AttachmentService, MinioService, AttachmentRepositoryPort],
})
export class AttachmentModule {}
