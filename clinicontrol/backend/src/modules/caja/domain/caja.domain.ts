export type CajaEstado = 'abierta' | 'cerrada';

export class CajaSessionDomain {
  constructor(
    public id: number,
    public fechaApertura: Date,
    public montoInicial: number,
    public estado: CajaEstado,
    public usuarioId: number,
    public fechaCierre?: Date,
    public montoFinal?: number,
    public observaciones?: string,
    public createdAt?: Date,
  ) {}

  cerrar(montoFinal: number, observaciones?: string): void {
    this.estado = 'cerrada';
    this.fechaCierre = new Date();
    this.montoFinal = montoFinal;
    this.observaciones = observaciones;
  }
}
