import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from '../../../entities/cita.entity';
import { EstadoCita } from '../../../entities/estado-cita.entity';
import { CitaService } from '../application/cita.service';
import { CitaDomainService } from '../domain/services/cita-domain.service';
import { CitaRepositoryPort } from '../domain/ports/cita-repository.port';
import { CitaRepositoryAdapter } from './persistence/cita-repository.adapter';
import { CitaController } from './controllers/cita.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cita, EstadoCita])],
  providers: [
    CitaService,
    CitaDomainService,
    {
      provide: CitaRepositoryPort,
      useClass: CitaRepositoryAdapter,
    },
  ],
  controllers: [CitaController],
  exports: [CitaService, CitaRepositoryPort],
})
export class CitaModule {}
