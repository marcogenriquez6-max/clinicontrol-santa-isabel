import api from './axios';

export interface Triage {
  id: number;
  pacienteId: number;
  realizadoPorId: number;
  fechaHora: string;
  estado: string;
  esiNivel: number;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  presionArterial?: string;
  frecuenciaRespiratoria?: number;
  saturacionOxigeno?: number;
  peso?: number;
  talla?: number;
  glucosa?: number;
  motivoConsulta?: string;
}

export interface CreateTriage {
  pacienteId: number;
  esiNivel: number;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaRespiratoria?: number;
  spo2?: number;
  peso?: number;
  talla?: number;
  motivoConsulta?: string;
}

export const triageService = {
  getAll: () => api.get<Triage[]>('/triage'),
  getActivos: () => api.get<Triage[]>('/triage/activos'),
  create: (data: CreateTriage) => api.post<Triage>('/triage', data),
  update: (id: number, data: Partial<Triage>) => api.put<Triage>(`/triage/${id}`, data),
  delete: (id: number) => api.delete(`/triage/${id}`),
};
