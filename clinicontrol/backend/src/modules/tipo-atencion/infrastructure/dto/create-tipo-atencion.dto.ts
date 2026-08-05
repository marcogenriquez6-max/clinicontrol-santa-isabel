import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoAtencionDto {
  @ApiProperty({ example: 'Consulta Médica' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  monto: number;
}

export class UpdateTipoAtencionDto {
  @ApiPropertyOptional({ example: 'Consulta Médica' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
