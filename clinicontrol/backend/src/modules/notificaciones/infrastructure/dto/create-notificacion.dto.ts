import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MinLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificacionTipo,
  NotificacionPrioridad,
  NotificacionCanal,
} from '../../../../entities/notificacion.entity';

export class CreateNotificacionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  usuarioId: number;

  @ApiProperty({ example: 'Nueva cita asignada' })
  @IsString()
  @MinLength(3)
  titulo: string;

  @ApiProperty({ example: 'Se le ha asignado una cita para el 15/05/2024' })
  @IsString()
  @MinLength(5)
  mensaje: string;

  @ApiPropertyOptional({
    enum: NotificacionTipo,
    default: NotificacionTipo.INFO,
  })
  @IsOptional()
  @IsEnum(NotificacionTipo)
  tipo?: NotificacionTipo;

  @ApiPropertyOptional({
    enum: NotificacionPrioridad,
    default: NotificacionPrioridad.MEDIA,
  })
  @IsOptional()
  @IsEnum(NotificacionPrioridad)
  prioridad?: NotificacionPrioridad;

  @ApiPropertyOptional({
    enum: NotificacionCanal,
    default: NotificacionCanal.IN_APP,
  })
  @IsOptional()
  @IsEnum(NotificacionCanal)
  canal?: NotificacionCanal;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  referenciaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accionUrl?: string;
}

export class CreateNotificacionMasivaDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  usuarioIds: number[];

  @ApiProperty({ example: 'Mantenimiento programado' })
  @IsString()
  @MinLength(3)
  titulo: string;

  @ApiProperty({ example: 'El sistema estará en mantenimiento el sábado' })
  @IsString()
  @MinLength(5)
  mensaje: string;

  @ApiPropertyOptional({ enum: NotificacionTipo })
  @IsOptional()
  @IsEnum(NotificacionTipo)
  tipo?: NotificacionTipo;

  @ApiPropertyOptional({ enum: NotificacionPrioridad })
  @IsOptional()
  @IsEnum(NotificacionPrioridad)
  prioridad?: NotificacionPrioridad;
}

export class UpdatePreferenciasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['info', 'recordatorio'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tiposSuscritos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  silentHoursStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  silentHoursEnd?: string;
}

export class NotificacionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  leida?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificacionTipo)
  tipo?: NotificacionTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificacionPrioridad)
  prioridad?: NotificacionPrioridad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 20;
}
