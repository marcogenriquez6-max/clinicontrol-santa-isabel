import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentController } from './infrastructure/controllers/attachment.controller';
import { AttachmentService } from './application/attachment.service';
import { AttachmentEntityType } from '../../entities/attachment.entity';
import { Readable, PassThrough } from 'stream';

describe('AttachmentController', () => {
  let controller: AttachmentController;

  const mockService = {
    upload: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getFile: jest.fn(),
    getThumbnail: jest.fn(),
    delete: jest.fn(),
  };

  const mockRes = () => {
    const pt = new PassThrough();
    return Object.assign(pt, {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headers: {},
    }) as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentController],
      providers: [{ provide: AttachmentService, useValue: mockService }],
    }).compile();

    controller = module.get<AttachmentController>(AttachmentController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should call service.upload with file and dto', async () => {
      const file = { originalname: 'test.jpg' } as Express.Multer.File;
      const dto = {
        entityType: AttachmentEntityType.CUSTOMER,
        entityId: 'uuid',
      };
      mockService.upload.mockResolvedValue({} as any);

      await controller.upload(file, dto);
      expect(mockService.upload).toHaveBeenCalledWith(
        file,
        AttachmentEntityType.CUSTOMER,
        'uuid',
      );
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      mockService.findAll.mockResolvedValue([]);
      await controller.findAll('customer', 'uuid');
      expect(mockService.findAll).toHaveBeenCalledWith('customer', 'uuid');
    });

    it('should call service.findAll without params', async () => {
      mockService.findAll.mockResolvedValue([]);
      await controller.findAll(undefined, undefined);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockService.findOne.mockResolvedValue({} as any);
      await controller.findOne('uuid-1');
      expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('download', () => {
    it('should pipe file stream to response', async () => {
      const stream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockService.getFile.mockResolvedValue({
        stream,
        mimeType: 'image/jpeg',
        filename: 'test.jpg',
      });
      const res = mockRes();

      await controller.download('uuid-1', res);
      expect(mockService.getFile).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('thumbnail', () => {
    it('should return thumbnail if available', async () => {
      const stream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockService.getThumbnail.mockResolvedValue({
        stream,
        mimeType: 'image/jpeg',
      });
      const res = mockRes();

      await controller.thumbnail('uuid-1', res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    });

    it('should return 404 when no thumbnail', async () => {
      mockService.getThumbnail.mockResolvedValue(null);
      const res = mockRes();

      await controller.thumbnail('uuid-1', res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      mockService.delete.mockResolvedValue(undefined);
      await controller.delete('uuid-1');
      expect(mockService.delete).toHaveBeenCalledWith('uuid-1');
    });
  });
});
