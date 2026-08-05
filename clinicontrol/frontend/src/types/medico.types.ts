export interface Medico {
  id?: number;
  nombre: string;
  apellido: string;
  especialidadId: number;
  especialidad?: Especialidad;
  telefono?: string;
  email?: string;
}

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface HorarioMedico {
  id?: number;
  medicoId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  horaInicioTarde?: string;
  horaFinTarde?: string;
  duracionSlotMinutos: number;
  activo: boolean;
}

export interface BloqueoAgenda {
  id: number;
  medicoId: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
}

export interface SlotDisponible {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  estado?: string;
}
