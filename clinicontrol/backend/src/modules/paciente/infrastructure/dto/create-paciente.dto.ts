import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePacienteDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  apellido: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  ci: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  fechaNacimiento: Date;

  @ApiProperty({ example: 1 })
  @IsInt()
  generoId: number;

  @ApiPropertyOptional({ example: '+591 77712345' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Calle Bolívar #123' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ example: 'juan.perez@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  grupoSanguineoId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sucursalId?: number;

  @ApiPropertyOptional({ example: 'Cardiología' })
  @IsString()
  @IsOptional()
  especialidad?: string;
}

export class UpdatePacienteDto {
  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Pérez García' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  apellido?: string;

  @ApiPropertyOptional({ example: '87654321' })
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(20)
  ci?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsDateString()
  @IsOptional()
  fechaNacimiento?: Date;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  generoId?: number;

  @ApiPropertyOptional({ example: '+591 77754321' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Av. 6 de Agosto #456' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ example: 'juanc.perez@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  grupoSanguineoId?: number;

  @ApiPropertyOptional({ example: 'activo' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ example: 'Cardiología' })
  @IsString()
  @IsOptional()
  especialidad?: string;
}

export class PacienteQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
