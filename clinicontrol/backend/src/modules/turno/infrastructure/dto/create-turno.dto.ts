import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTurnoDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  pacienteId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  medicoId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  citaId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipoAtencionId?: number;

  @ApiPropertyOptional({ example: 'consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo?: string;

  @ApiProperty({ example: 200 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pagado?: boolean;
}

export class UpdateTurnoEstadoDto {
  @ApiProperty({ enum: ['llamado', 'atencion', 'completado', 'cancelado'] })
  @IsString()
  estado: string;
}

export class TurnoQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicoId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pacienteId?: number;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsString()
  fecha?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
