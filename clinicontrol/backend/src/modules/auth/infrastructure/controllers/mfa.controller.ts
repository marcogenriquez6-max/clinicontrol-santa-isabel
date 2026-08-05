import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { MfaSetupDto, MfaVerifyDto, MfaDisableDto } from '../auth-dto/mfa.dto';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@ApiTags('MFA')
@Controller('auth/mfa')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MfaController {
  private readonly logger = new Logger(MfaController.name);

  constructor(private readonly authRepository: AuthRepositoryPort) {}

  @Post('setup')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async setup(@CurrentUser() user: { id: number }, @Body() dto: MfaSetupDto) {
    const secret = speakeasy.generateSecret({ name: `MedSys:${user.id}` });
    const userDomain = await this.authRepository.findById(user.id);
    if (!userDomain) throw new BadRequestException('Usuario no encontrado');

    userDomain.habilitarMfa(secret.base32, dto.method);
    await this.authRepository.save(userDomain);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);
    return { qrCode, method: dto.method };
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async verify(@CurrentUser() user: { id: number }, @Body() dto: MfaVerifyDto) {
    const userDomain = await this.authRepository.findById(user.id);
    if (!userDomain?.mfaSecret)
      throw new BadRequestException('MFA no configurado');

    const verified = speakeasy.totp.verify({
      secret: userDomain.mfaSecret,
      encoding: 'base32',
      token: dto.code,
      window: 2,
    });
    if (!verified) throw new UnauthorizedException('Código inválido');

    if (!userDomain.mfaEnabled) {
      userDomain.verificarMfa();
      await this.authRepository.save(userDomain);
    }

    this.logger.log(`[MFA] User ${user.id} verified MFA successfully`);
    return { verified: true, enabled: true };
  }

  @Post('disable')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async disable(
    @CurrentUser() user: { id: number },
    @Body() dto: MfaDisableDto,
  ) {
    const userDomain = await this.authRepository.findById(user.id);
    if (!userDomain?.mfaSecret)
      throw new BadRequestException('MFA no configurado');

    const verified = speakeasy.totp.verify({
      secret: userDomain.mfaSecret,
      encoding: 'base32',
      token: dto.code,
      window: 2,
    });
    if (!verified) throw new UnauthorizedException('Código inválido');

    userDomain.deshabilitarMfa();
    await this.authRepository.save(userDomain);

    this.logger.log(`[MFA] User ${user.id} disabled MFA`);
    return { disabled: true };
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async status(@CurrentUser() user: { id: number }) {
    const userDomain = await this.authRepository.findById(user.id);
    return {
      enabled: userDomain?.mfaEnabled ?? false,
      method: userDomain?.mfaMethod || null,
      setupComplete: !!userDomain?.mfaSecret,
    };
  }
}
