export interface EstadoCita {
  id: number;
  nombre: string;
}

export interface Cita {
  id?: number;
  pacienteId: number;
  paciente?: import('./paciente.types').Paciente;
  medicoId: number;
  medico?: import('./medico.types').Medico;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  estadoId: number;
  estado?: EstadoCita;
  motivo?: string;
  sucursalId?: number;
  createdAt?: string;
}
