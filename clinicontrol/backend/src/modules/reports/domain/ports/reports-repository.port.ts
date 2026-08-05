export interface PacienteReportData {
  id: number;
  nombre: string;
  apellido: string;
  ci?: string;
  fechaNacimiento?: Date;
  telefono?: string;
  email?: string;
  genero?: { nombre: string };
  grupoSanguineo?: { nombre: string };
  activo: boolean;
  createdAt: Date;
  consultas: ConsultaReportData[];
}

export interface ConsultaReportData {
  fecha?: Date;
  medico?: { nombre: string; apellido: string };
  medicoNombre?: string;
  motivo?: string;
  sintomas?: string;
  observaciones?: string;
  diagnosticos: DiagnosticoReportData[];
  recetas: RecetaReportData[];
}

export interface DiagnosticoReportData {
  cie10?: { codigo: string; descripcion: string };
}

export interface RecetaReportData {
  items: RecetaItemReportData[];
}

export interface RecetaItemReportData {
  medicamento?: { nombre: string };
  dosis?: string;
  frecuencia?: string;
}

export interface CitaReportData {
  paciente?: { nombre: string; apellido: string };
  medico?: {
    nombre: string;
    apellido: string;
    especialidad?: { nombre: string };
  };
  estado?: { nombre: string };
  fecha?: Date;
}

export interface EstadisticasData {
  totalPacientes: number;
  totalMedicos: number;
  totalCitas: number;
  totalConsultas: number;
  citasHoy: number;
  recetasActivas: number;
}

export interface DashboardData {
  totalPacientes: number;
  totalMedicos: number;
  totalCitas: number;
  totalConsultas: number;
  citasPendientes: number;
  turnosHoy: number;
  citasHoy: number;
  pacientesHoy: number;
  recetasActivas: number;
}

export abstract class ReportsRepositoryPort {
  abstract findPacienteConHistorial(
    pacienteId: number,
  ): Promise<PacienteReportData | null>;

  abstract findCitas(
    fechaInicio?: string,
    fechaFin?: string,
    medicoId?: number,
    estadoId?: number,
  ): Promise<CitaReportData[]>;

  abstract getEstadisticas(): Promise<EstadisticasData>;

  abstract findAllPacientes(): Promise<PacienteReportData[]>;

  abstract getDashboard(): Promise<DashboardData>;
}
