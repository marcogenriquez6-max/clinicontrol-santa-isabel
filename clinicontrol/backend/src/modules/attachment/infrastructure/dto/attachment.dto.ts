import { IsUUID, IsOptional, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentEntityType } from '../../../../entities/attachment.entity';

export class UploadAttachmentDto {
  @ApiProperty({
    enum: AttachmentEntityType,
    example: AttachmentEntityType.CUSTOMER,
  })
  @IsEnum(AttachmentEntityType)
  entityType: AttachmentEntityType;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-3bb9d9a45c71' })
  @IsUUID()
  entityId: string;
}

export class AttachmentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() entityType: string;
  @ApiProperty() entityId: string;
  @ApiProperty() filename: string;
  @ApiProperty() originalName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() size: number;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiProperty() url: string;
  @ApiProperty() createdAt: Date;
}

export class FileQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
