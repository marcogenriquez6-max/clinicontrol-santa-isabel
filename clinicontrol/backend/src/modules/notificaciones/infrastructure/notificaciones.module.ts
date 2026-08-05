import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notificacion,
  PreferenciaNotificacion,
} from '../../../entities/notificacion.entity';
import { NotificacionesService } from '../application/notificaciones.service';
import { NotificacionesRepositoryPort } from '../domain/ports/notificaciones-repository.port';
import { NotificacionesRepositoryAdapter } from './persistence/notificaciones-repository.adapter';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { RealtimeModule } from '../../websocket/infrastructure/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion, PreferenciaNotificacion]),
    RealtimeModule,
  ],
  providers: [
    NotificacionesService,
    {
      provide: NotificacionesRepositoryPort,
      useClass: NotificacionesRepositoryAdapter,
    },
  ],
  controllers: [NotificacionesController],
  exports: [NotificacionesService, NotificacionesRepositoryPort],
})
export class NotificacionesModule {}
