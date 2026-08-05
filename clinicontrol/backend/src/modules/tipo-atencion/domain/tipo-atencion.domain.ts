export class TipoAtencionDomain {
  constructor(
    public readonly id?: number,
    public readonly nombre?: string,
    public readonly monto?: number,
    public activo = true,
  ) {}
}
