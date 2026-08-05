import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesGateway } from './gateways/notificaciones.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET!,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [NotificacionesGateway],
  exports: [NotificacionesGateway],
})
export class RealtimeModule {}
