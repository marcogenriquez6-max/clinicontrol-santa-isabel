import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentService } from './application/attachment.service';
import { AttachmentRepositoryPort } from './domain/ports/attachment-repository.port';
import { MinioService } from '../../common/services/minio.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';

describe('AttachmentService', () => {
  let service: AttachmentService;
  let minioService: jest.Mocked<MinioService>;

  const mockAttachmentRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockMinioService = {
    upload: jest.fn().mockResolvedValue({}),
    getStream: jest.fn(),
    getPresignedUrl: jest.fn().mockResolvedValue('https://presigned.url'),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        {
          provide: AttachmentRepositoryPort,
          useValue: mockAttachmentRepo,
        },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
    minioService = module.get(MinioService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
      fieldname: 'file',
      encoding: '7bit',
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload file and save metadata', async () => {
      const savedAttach = {
        id: 'uuid-1',
        entityType: 'customer',
        entityId: 'cust-uuid',
        filename: '2026-05-31/uuid-test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '2026-05-31/uuid-test.jpg',
        thumbnailPath: null,
        createdAt: new Date(),
      };

      mockAttachmentRepo.create.mockResolvedValue(savedAttach);

      const result = await service.upload(mockFile, 'customer', 'cust-uuid');

      expect(result).toBeDefined();
      expect(result.originalName).toBe('test.jpg');
      expect(minioService.upload).toHaveBeenCalled();
    });

    it('should throw BadRequestException for no file', async () => {
      await expect(
        service.upload(null as any, 'customer', 'id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const badFile = { ...mockFile, mimetype: 'application/exe' };
      await expect(
        service.upload(badFile, 'customer', 'id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for oversized file', async () => {
      const bigFile = { ...mockFile, size: 15 * 1024 * 1024 };
      await expect(
        service.upload(bigFile, 'customer', 'id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return attachments filtered by entity', async () => {
      const attachments = [{ id: '1', originalName: 'doc.pdf' }];
      mockAttachmentRepo.findAll.mockResolvedValue(attachments);

      const result = await service.findAll('customer', 'cust-id');
      expect(result).toHaveLength(1);
      expect(mockAttachmentRepo.findAll).toHaveBeenCalledWith(
        'customer',
        'cust-id',
      );
    });

    it('should return all attachments when no filter', async () => {
      mockAttachmentRepo.findAll.mockResolvedValue([]);
      await service.findAll();
      expect(mockAttachmentRepo.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should return attachment by id', async () => {
      const attach = { id: 'uuid-1', originalName: 'test.jpg' };
      mockAttachmentRepo.findById.mockResolvedValue(attach);

      const result = await service.findOne('uuid-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockAttachmentRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFile', () => {
    it('should return file stream', async () => {
      const attach = {
        id: '1',
        path: 'obj-path',
        mimeType: 'image/jpeg',
        originalName: 'test.jpg',
      };
      mockAttachmentRepo.findById.mockResolvedValue(attach);
      mockMinioService.getStream.mockResolvedValue(new Readable());

      const result = await service.getFile('1');
      expect(result.stream).toBeDefined();
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.filename).toBe('test.jpg');
    });

    it('should throw NotFoundException', async () => {
      mockAttachmentRepo.findById.mockResolvedValue(null);
      await expect(service.getFile('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getThumbnail', () => {
    it('should return thumbnail stream when available', async () => {
      const attach = { id: '1', thumbnailPath: 'thumb/path' };
      mockAttachmentRepo.findById.mockResolvedValue(attach);
      mockMinioService.getStream.mockResolvedValue(new Readable());

      const result = await service.getThumbnail('1');
      expect(result).toBeDefined();
      expect(result!.mimeType).toBe('image/jpeg');
    });

    it('should return null when no thumbnail', async () => {
      const attach = { id: '1', thumbnailPath: null };
      mockAttachmentRepo.findById.mockResolvedValue(attach);

      const result = await service.getThumbnail('1');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete and remove from minio', async () => {
      const attach = {
        id: '1',
        path: 'obj-path',
        thumbnailPath: 'thumb/path',
        originalName: 'test.jpg',
      };
      mockAttachmentRepo.findById.mockResolvedValue(attach);
      mockAttachmentRepo.delete.mockResolvedValue(undefined);

      await service.delete('1');
      expect(minioService.delete).toHaveBeenCalledTimes(2);
      expect(mockAttachmentRepo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException', async () => {
      mockAttachmentRepo.findById.mockResolvedValue(null);
      await expect(service.delete('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
