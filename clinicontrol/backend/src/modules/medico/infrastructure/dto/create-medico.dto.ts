import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicoDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellido: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  especialidadId: number;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan.perez@hospital.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class UpdateMedicoDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellido?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  especialidadId?: number;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan.perez@hospital.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
