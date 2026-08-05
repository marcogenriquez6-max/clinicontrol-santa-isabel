import { TurnoDomain, EstadoTurno } from '../turno.domain';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TurnoQuery {
  estado?: string;
  medicoId?: number;
  pacienteId?: number;
  fecha?: string;
  page?: number;
  limit?: number;
}

export abstract class TurnoRepositoryPort {
  abstract findAll(query: TurnoQuery): Promise<{
    data: TurnoDomain[];
    meta: PaginationMeta;
  }>;

  abstract findById(id: number): Promise<TurnoDomain | null>;

  abstract findTV(): Promise<TurnoDomain[]>;

  abstract getUltimoNumero(): Promise<number>;

  abstract save(turno: TurnoDomain): Promise<TurnoDomain>;

  abstract updateEstado(id: number, estado: EstadoTurno): Promise<TurnoDomain>;

  abstract marcarPagado(id: number): Promise<TurnoDomain>;

  abstract remove(id: number): Promise<void>;
}
