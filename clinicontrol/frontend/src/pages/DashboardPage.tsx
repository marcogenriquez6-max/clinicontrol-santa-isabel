import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, UserRound, Calendar, Stethoscope,
  Activity, Clock, Ticket, DollarSign, ArrowRight, TrendingUp,
  Pill, Shield, FileBarChart,
} from 'lucide-react';
import { reportsService, pacienteService, medicoService, citaService, consultaService } from '../api/services';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface DashboardStats {
  pacientes: number;
  medicos: number;
  consultas: number;
  citas: number;
  citasPendientes: number;
  turnosHoy: number;
}

interface RecentActivity {
  type: 'paciente' | 'cita' | 'consulta' | 'pago';
  time: string;
  text: string;
}

interface RawItem {
  createdAt?: string;
  nombre?: string;
  apellido?: string;
  paciente?: { nombre?: string; apellido?: string };
  medico?: { nombre?: string };
  fecha?: string;
  estadoId?: number | string;
  estado?: { id?: number | string };
}

interface ApiResponseShape {
  data?: unknown;
  totalPacientes?: number;
  totalMedicos?: number;
  totalCitas?: number;
  totalConsultas?: number;
  ingresosHoy?: number;
  citasPendientes?: number;
  turnosHoy?: number;
}

function extractData(res: unknown): RawItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as RawItem[];
  const outer = (res as ApiResponseShape)?.data ?? res;
  if (Array.isArray(outer)) return outer as RawItem[];
  if (outer && typeof outer === 'object' && Array.isArray((outer as { data?: unknown }).data)) {
    return (outer as { data: RawItem[] }).data;
  }
  return [];
}

interface StatCardDef {
  icon: typeof Users;
  label: string;
  key: keyof DashboardStats;
  roles?: string[];
}

const statCards: StatCardDef[] = [
  { icon: Users, label: 'Pacientes Registrados', key: 'pacientes' },
  { icon: UserRound, label: 'Médicos Activos', key: 'medicos', roles: ['admin', 'gerente'] },
  { icon: Stethoscope, label: 'Consultas Realizadas', key: 'consultas' },
  { icon: Calendar, label: 'Citas Agendadas', key: 'citas' },
  { icon: Clock, label: 'Citas Pendientes', key: 'citasPendientes' },
  { icon: Ticket, label: 'Turnos de Hoy', key: 'turnosHoy', roles: ['admin', 'gerente', 'recepcionista', 'secretaria'] },
];

const cardColors = [
  { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-violet-50 dark:bg-violet-900/30', icon: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-amber-50 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/30', icon: 'text-cyan-600 dark:text-cyan-400' },
  { bg: 'bg-rose-50 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400' },
];

interface QuickActionDef {
  label: string;
  icon: typeof UserRound;
  to: string;
  roles?: string[];
}

const allQuickActions: QuickActionDef[] = [
  { label: 'Nuevo Paciente', icon: UserRound, to: '/pacientes' },
  { label: 'Sala de Espera', icon: Clock, to: '/turnos/sala-espera' },
  { label: 'Historia Clínica', icon: Stethoscope, to: '/historia-clinica' },
  { label: 'Nueva Receta', icon: Pill, to: '/recetas', roles: ['admin', 'medico'] },
  { label: 'Vacunación', icon: Shield, to: '/vacunas', roles: ['admin', 'medico', 'enfermera'] },
  { label: 'Reportes', icon: FileBarChart, to: '/reportes', roles: ['admin', 'gerente'] },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const userRole = user?.rol ?? '';
  const [stats, setStats] = useState<DashboardStats>({
    pacientes: 0, medicos: 0, citas: 0, consultas: 0, citasPendientes: 0, turnosHoy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activity, setActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const dashRes = await reportsService.getDashboard();
      const dash = (dashRes?.data ?? dashRes) as ApiResponseShape;
      if (dash?.totalPacientes !== undefined) {
        setStats({
          pacientes: dash.totalPacientes ?? 0,
          medicos: dash.totalMedicos ?? 0,
          citas: dash.totalCitas ?? 0,
          consultas: dash.totalConsultas ?? 0,
          citasPendientes: dash.citasPendientes ?? 0,
          turnosHoy: dash.turnosHoy ?? 0,
        });
        setError(false);
        setLoading(false);
        return;
      }
    } catch { /* fallback */ }

    try {
      const [pacientes, medicos, citas, consultas] = await Promise.all([
        pacienteService.getAll().catch(() => null),
        medicoService.getAll().catch(() => null),
        citaService.getAll().catch(() => null),
        consultaService.getAll().catch(() => null),
      ]);
      const citasArr = extractData(citas);
      const consultasArr = extractData(consultas);
      const pacientesArr = extractData(pacientes);
      const medicosArr = extractData(medicos);

      setStats({
        pacientes: pacientesArr.length,
        medicos: medicosArr.length,
        citas: citasArr.length,
        consultas: consultasArr.length,
        citasPendientes: citasArr.filter((c) => {
          const estado = c.estadoId || c.estado?.id;
          return estado === 1 || estado === '1';
        }).length,
        turnosHoy: citasArr.filter((c) => {
          const fecha = c.fecha ? new Date(c.fecha) : null;
          if (!fecha) return false;
          return fecha.toDateString() === new Date().toDateString();
        }).length,
      });

      const activities: RecentActivity[] = [];
      if (pacientesArr.length > 0) {
        const last = pacientesArr[pacientesArr.length - 1];
        activities.push({
          type: 'paciente',
          time: last.createdAt ? new Date(last.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          text: `Nuevo paciente: ${last.nombre ?? ''} ${last.apellido ?? ''}`,
        });
      }
      if (consultasArr.length > 0) {
        const c = consultasArr[consultasArr.length - 1];
        activities.push({
          type: 'consulta',
          time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          text: `Consulta: ${c.paciente?.nombre ?? ''} ${c.paciente?.apellido ?? ''}`,
        });
      }
      if (citasArr.length > 0) {
        const c = citasArr[citasArr.length - 1];
        activities.push({
          type: 'cita',
          time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          text: `Cita: ${c.paciente?.nombre ?? ''} ${c.paciente?.apellido ?? ''} con Dr. ${c.medico?.nombre ?? ''}`,
        });
      }
      setActivity(activities);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const visibleStatCards = statCards.filter((c) => !c.roles || c.roles.includes(userRole));
  const visibleQuickActions = allQuickActions.filter((a) => !a.roles || a.roles.includes(userRole));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            <div className="space-y-2">
              <div className="w-40 h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="w-56 h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 pb-6 mb-8" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Panel de Control</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Clínica Santa Isabel</p>
          </div>
        </div>
        <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Activity className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Error de conexión</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>No se pudieron cargar los datos. Verifique que el servidor esté en funcionamiento.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl shadow-sm p-6 mb-8"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Panel de Control</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Clínica Santa Isabel</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Datos actualizados</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {visibleStatCards.map((card, idx) => {
          const val = stats[card.key];
          const display = val;
          const color = cardColors[idx % cardColors.length];
          return (
            <div key={card.key} className="rounded-xl shadow-sm p-6"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-full ${color.bg} ${color.icon} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {typeof display === 'number' ? display.toLocaleString() : display}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Acceso Rápido</h3>
          </div>
          <div className="p-4">
            {visibleQuickActions.map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg transition-colors group"
                  style={{ color: 'var(--text-secondary)' }}>
                  <div className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                  <ArrowRight className="w-4 h-4 transition-all" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Actividad Reciente</h3>
          </div>
          <div className="p-4">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10" style={{ color: 'var(--text-tertiary)' }}>
                <Activity className="w-8 h-8" />
                <p className="text-sm">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    <div className="p-1.5 rounded-lg mt-0.5" style={{
                      backgroundColor: a.type === 'paciente' ? 'var(--primary-50)' :
                        a.type === 'cita' ? '#fef3c71a' :
                        a.type === 'consulta' ? '#d1fae51a' : '#cffafe1a',
                    }}>
                      {a.type === 'paciente' ? <UserRound className="w-3.5 h-3.5" style={{ color: 'var(--primary-500)' }} /> :
                       a.type === 'cita' ? <Calendar className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} /> :
                       a.type === 'consulta' ? <Stethoscope className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> :
                       <DollarSign className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
