import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CajaRepositoryPort } from '../domain/ports/caja-repository.port';
import { CajaSessionDomain } from '../domain/caja.domain';

@Injectable()
export class CajaService {
  constructor(private readonly cajaRepo: CajaRepositoryPort) {}

  async findAll(): Promise<CajaSessionDomain[]> {
    return this.cajaRepo.findAll('DESC');
  }

  async findOne(id: number): Promise<CajaSessionDomain> {
    const session = await this.cajaRepo.findById(id);
    if (!session) throw new NotFoundException(`Sesión de caja ${id} no encontrada`);
    return session;
  }

  async getSesionActual(): Promise<CajaSessionDomain | null> {
    return this.cajaRepo.findSesionAbierta();
  }

  async abrirSesion(montoInicial: number, usuarioId: number): Promise<CajaSessionDomain> {
    const abierta = await this.cajaRepo.findSesionAbierta();
    if (abierta) throw new BadRequestException('Ya hay una sesión de caja abierta');
    return this.cajaRepo.create({ fechaApertura: new Date(), montoInicial, estado: 'abierta', usuarioId });
  }

  async cerrarSesion(id: number, montoFinal: number, observaciones?: string): Promise<CajaSessionDomain> {
    const session = await this.findOne(id);
    if (session.estado === 'cerrada') throw new BadRequestException('La sesión ya está cerrada');
    session.cerrar(montoFinal, observaciones);
    await this.cajaRepo.update(id, {
      estado: session.estado,
      fechaCierre: session.fechaCierre,
      montoFinal: session.montoFinal,
      observaciones: session.observaciones,
    });
    return session;
  }
}
