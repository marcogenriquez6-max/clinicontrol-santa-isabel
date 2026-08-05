import api from './axios';
import type { AuthResponse } from '../types';

export const authService = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  loginMfa: (mfaToken: string, code: string) => api.post<AuthResponse>('/auth/login/mfa', { mfaToken, code }),
  register: (data: { nombre: string; apellido: string; email: string; password: string; ci?: string; rolId?: number }) => api.post<AuthResponse>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<AuthResponse>('/auth/refresh'),
  profile: () => api.get('/auth/profile'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
};
