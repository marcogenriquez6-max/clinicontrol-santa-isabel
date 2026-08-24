import { BaseEntity } from '../../../common/domain/base.entity';

export type EstadoTurno =
  | 'espera'
  | 'llamado'
  | 'atencion'
  | 'completado'
  | 'cancelado';

const TRANSITIONS: Record<EstadoTurno, EstadoTurno[]> = {
  espera: ['llamado', 'atencion', 'cancelado'],
  llamado: ['atencion', 'cancelado'],
  atencion: ['completado', 'cancelado'],
  completado: [],
  cancelado: [],
};

export interface TurnoData {
  numero: number;
  pacienteId: number;
  medicoId: number;
  citaId?: number;
  tipoAtencionId?: number;
  tipo?: string;
  monto: number;
  pagado?: boolean;
  creadoPorId: number;
  fechaProgramada?: string;
  horaProgramada?: string;
}

export class TurnoDomain extends BaseEntity {
  constructor(
    public readonly numero: number,
    public readonly pacienteId: number,
    public readonly medicoId: number,
    public estado: EstadoTurno = 'espera',
    public monto: number = 0,
    public pagado = false,
    public pagadoEn?: Date,
    id?: number,
    public citaId?: number,
    public tipoAtencionId?: number,
    public tipo?: string,
    public pacienteNombre?: string,
    public pacienteCI?: string,
    public pacienteTel?: string,
    public medicoNombre?: string,
    public especialidad?: string,
    public consultorio?: string,
  ) {
    super(id);
    this.fechaProgramada = undefined;
    this.horaProgramada = undefined;
  }

  public fechaProgramada?: string;
  public horaProgramada?: string;

  static create(data: TurnoData): TurnoDomain {
    const turno = new TurnoDomain(
      data.numero,
      data.pacienteId,
      data.medicoId,
      'espera',
      data.monto,
      data.pagado ?? false,
      undefined,
      undefined,
      data.citaId,
      data.tipoAtencionId,
      data.tipo,
    );
    turno.fechaProgramada = data.fechaProgramada;
    turno.horaProgramada = data.horaProgramada;
    return turno;
  }

  llamar(): void {
    this.validarTransicion('llamado');
    this.estado = 'llamado';
  }

  iniciarAtencion(): void {
    this.validarTransicion('atencion');
    this.estado = 'atencion';
  }

  completar(): void {
    this.validarTransicion('completado');
    this.estado = 'completado';
  }

  cancelar(): void {
    this.validarTransicion('cancelado');
    this.estado = 'cancelado';
  }

  marcarPagado(): void {
    this.pagado = true;
    this.pagadoEn = new Date();
  }

  private validarTransicion(nuevoEstado: EstadoTurno): void {
    const permitidos = TRANSITIONS[this.estado];
    if (!permitidos.includes(nuevoEstado)) {
      throw new Error(
        `Transicion de estado invalida: "${this.estado}" -> "${nuevoEstado}"`,
      );
    }
  }
}
