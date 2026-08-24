import api from './axios';
import type { Turno } from '../types';

export const turnoService = {
  getAll: (params?: { estado?: string; medicoId?: number; pacienteId?: number; page?: number; limit?: number }) =>
    api.get<Turno[]>('/turnos', { params }),
  getById: (id: number) => api.get<Turno>(`/turnos/${id}`),
  getTV: () => api.get<Turno[]>('/turnos/tv'),
  create: (data: { pacienteId: number; medicoId: number; citaId?: number; tipoAtencionId?: number; tipo?: string; monto: number; pagado?: boolean; fechaProgramada?: string; horaProgramada?: string }) =>
    api.post<Turno>('/turnos', data),
  update: (id: number, data: { medicoId?: number; tipoAtencionId?: number; tipo?: string; monto?: number }) =>
    api.put<Turno>(`/turnos/${id}`, data),
  updateEstado: (id: number, estado: string) =>
    api.put<Turno>(`/turnos/${id}/estado`, { estado }),
  marcarPagado: (id: number) =>
    api.put<Turno>(`/turnos/${id}/pagar`),
  remove: (id: number) => api.delete(`/turnos/${id}`),
};
