import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MfaMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
}

export class MfaSetupDto {
  @ApiProperty({ enum: MfaMethod, example: MfaMethod.TOTP })
  @IsEnum(MfaMethod)
  method: MfaMethod;

  @ApiPropertyOptional({ example: '+584121234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class MfaVerifyDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiPropertyOptional({ example: 'totp' })
  @IsOptional()
  @IsEnum(MfaMethod)
  method?: MfaMethod;
}

export class MfaDisableDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class MfaStatusDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ enum: MfaMethod, nullable: true })
  method: MfaMethod | null;

  @ApiProperty()
  setupComplete: boolean;
}
