import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AttachmentService } from '../../application/attachment.service';
import {
  UploadAttachmentDto,
  AttachmentResponseDto,
} from '../dto/attachment.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Archivos')
@ApiBearerAuth()
@Controller('attachments')
@Roles('admin', 'medico', 'recepcionista', 'secretaria')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', enum: ['customer', 'interaction'] },
        entityId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({ summary: 'Subir archivo' })
  @ApiResponse({ status: 201, type: AttachmentResponseDto })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^(application\/pdf|image\/(jpeg|png|webp)|text\/plain)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentService.upload(
      file,
      dto.entityType,
      dto.entityId,
    ) as any;
  }

  @Get()
  @ApiOperation({ summary: 'Listar archivos' })
  @ApiResponse({ status: 200, type: [AttachmentResponseDto] })
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<AttachmentResponseDto[]> {
    return this.attachmentService.findAll(entityType, entityId) as any;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener metadata del archivo' })
  @ApiResponse({ status: 200, type: AttachmentResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentService.findOne(id) as any;
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar archivo' })
  @ApiResponse({ status: 200, description: 'Stream del archivo' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ): Promise<void> {
    const file = await this.attachmentService.getFile(id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    file.stream.pipe(res);
  }

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Obtener thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail image' })
  @ApiResponse({ status: 404, description: 'No thumbnail available' })
  async thumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ): Promise<void> {
    const thumb = await this.attachmentService.getThumbnail(id);
    if (!thumb) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Thumbnail not available' });
      return;
    }
    res.setHeader('Content-Type', thumb.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    thumb.stream.pipe(res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar archivo' })
  @ApiResponse({ status: 204, description: 'Archivo eliminado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attachmentService.delete(id);
  }
}
