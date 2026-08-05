import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  TurnoRepositoryPort,
  TurnoQuery,
} from '../domain/ports/turno-repository.port';
import { TurnoDomain } from '../domain/turno.domain';
import { CreateTurnoDto } from '../infrastructure/dto/create-turno.dto';

@Injectable()
export class TurnoService {
  constructor(private readonly turnoRepo: TurnoRepositoryPort) {}

  async findAll(query: TurnoQuery) {
    return this.turnoRepo.findAll(query);
  }

  async findOne(id: number): Promise<TurnoDomain> {
    const turno = await this.turnoRepo.findById(id);
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }
    return turno;
  }

  async getTV() {
    return this.turnoRepo.findTV();
  }

  async create(dto: CreateTurnoDto): Promise<TurnoDomain> {
    const ultimoNumero = await this.turnoRepo.getUltimoNumero();
    const domain = TurnoDomain.create({
      numero: ultimoNumero + 1,
      pacienteId: dto.pacienteId,
      medicoId: dto.medicoId,
      citaId: dto.citaId,
      tipoAtencionId: dto.tipoAtencionId,
      tipo: dto.tipo,
      monto: dto.monto,
      pagado: dto.pagado,
      creadoPorId: 0,
    });
    return this.turnoRepo.save(domain);
  }

  async updateEstado(id: number, estado: string): Promise<TurnoDomain> {
    const turno = await this.findOne(id);
    switch (estado) {
      case 'llamado':
        try {
          turno.llamar();
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
        break;
      case 'atencion':
        try {
          turno.iniciarAtencion();
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
        break;
      case 'completado':
        try {
          turno.completar();
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
        break;
      case 'cancelado':
        try {
          turno.cancelar();
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
        break;
      default:
        throw new BadRequestException(`Estado invalido: ${estado}`);
    }
    return this.turnoRepo.updateEstado(id, turno.estado);
  }

  async marcarPagado(id: number): Promise<TurnoDomain> {
    const turno = await this.findOne(id);
    turno.marcarPagado();
    return this.turnoRepo.marcarPagado(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.turnoRepo.remove(id);
  }
}
