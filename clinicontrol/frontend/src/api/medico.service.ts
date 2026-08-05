import api from './axios';
import type { Medico, Especialidad } from '../types';

export const medicoService = {
  getAll: () => api.get<Medico[]>('/medicos'),
  getById: (id: number) => api.get<Medico>(`/medicos/${id}`),
  getByEspecialidad: (id: number) => api.get<Medico[]>(`/medicos/especialidad/${id}`),
  create: (data: Partial<Medico>) => api.post<Medico>('/medicos', data),
  update: (id: number, data: Partial<Medico>) => api.put<Medico>(`/medicos/${id}`, data),
  delete: (id: number) => api.delete(`/medicos/${id}`),
};

export const especialidadService = {
  getAll: () => api.get<Especialidad[]>('/especialidades'),
  getById: (id: number) => api.get<Especialidad>(`/especialidades/${id}`),
  create: (data: Partial<Especialidad>) => api.post<Especialidad>('/especialidades', data),
  update: (id: number, data: Partial<Especialidad>) => api.put<Especialidad>(`/especialidades/${id}`, data),
  delete: (id: number) => api.delete(`/especialidades/${id}`),
};
