export interface Turno {
  id: number;
  numero: number;
  pacienteNombre: string;
  pacienteCI: string;
  pacienteTel?: string;
  medicoNombre: string;
  especialidad: string;
  consultorio: string;
  estado: 'espera' | 'llamado' | 'atencion' | 'completado' | 'cancelado';
  tipo: string | number;
  creadoEn: string;
  pagado: boolean;
  monto: number;
  pacienteId: number;
  medicoId: number;
  citaId?: number;
}

export interface TipoAtencion {
  id: number;
  nombre: string;
  monto: number;
  activo?: boolean;
}
