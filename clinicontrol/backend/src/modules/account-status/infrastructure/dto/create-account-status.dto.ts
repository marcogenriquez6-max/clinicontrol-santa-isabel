import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatusName } from '../../../../entities/account-status.entity';

export class CreateAccountStatusDto {
  @ApiProperty({ enum: AccountStatusName, example: AccountStatusName.ACTIVE })
  @IsEnum(AccountStatusName)
  name: AccountStatusName;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAccountStatusDto {
  @ApiPropertyOptional({ enum: AccountStatusName })
  @IsOptional()
  @IsEnum(AccountStatusName)
  name?: AccountStatusName;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
