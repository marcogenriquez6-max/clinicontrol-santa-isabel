import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserRound, Calendar, Stethoscope,
  Clock, ArrowRight, RefreshCw,
  Pill, ShieldCheck, FileText, Activity,
} from 'lucide-react';
import { reportsService, pacienteService, medicoService, citaService, consultaService } from '../api/services';
import api from '../api/axios';
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

const ZERO_STATS: DashboardStats = {
  pacientes: 0, medicos: 0, consultas: 0, citas: 0, citasPendientes: 0, turnosHoy: 0,
};

type ActivityKind = 'paciente' | 'historia' | 'cita' | 'receta' | 'auditoria';

interface RecentActivity {
  type: ActivityKind;
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
  accion?: string;
  entidad?: string;
}

function extractData(res: unknown): RawItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as RawItem[];
  const outer = (res as { data?: unknown })?.data ?? res;
  if (Array.isArray(outer)) return outer as RawItem[];
  if (outer && typeof outer === 'object' && Array.isArray((outer as { data?: unknown }).data)) {
    return (outer as { data: RawItem[] }).data;
  }
  return [];
}

interface StatCardDef {
  icon: typeof Users;
  label: string;
  key: keyof Pick<DashboardStats, 'pacientes' | 'medicos' | 'consultas' | 'citas'>;
  to: string;
}

const kpiCards: StatCardDef[] = [
  { icon: Users, label: 'Pacientes registrados', key: 'pacientes', to: '/pacientes' },
  { icon: UserRound, label: 'Médicos activos', key: 'medicos', to: '/medicos' },
  { icon: Stethoscope, label: 'Consultas realizadas', key: 'consultas', to: '/consultas' },
  { icon: Calendar, label: 'Citas agendadas', key: 'citas', to: '/citas' },
];

interface QuickActionDef {
  label: string;
  desc: string;
  icon: typeof UserRound;
  to: string;
  roles?: string[];
}

const allQuickActions: QuickActionDef[] = [
  { label: 'Nuevo Paciente', desc: 'Registrar con cédula única', icon: UserRound, to: '/pacientes' },
  { label: 'Nueva Cita', desc: 'Agendar con validación de horario', icon: Calendar, to: '/citas', roles: ['admin', 'recepcionista', 'secretaria'] },
  { label: 'Consulta Completa', desc: 'Formato SOAP con CIE-10 y receta', icon: FileText, to: '/consulta-completa', roles: ['admin', 'medico'] },
  { label: 'Nueva Receta', desc: 'Con alertas de alergias e interacciones', icon: Pill, to: '/recetas', roles: ['admin', 'medico'] },
  { label: 'Registro de Triaje', desc: 'Clasificación ESI por severidad', icon: Activity, to: '/triaje', roles: ['admin', 'medico', 'enfermeria'] },
  { label: 'Auditoría del Sistema', desc: 'Trazabilidad de acciones', icon: ShieldCheck, to: '/admin/audit', roles: ['admin', 'gerente'] },
];

const activityStyle: Record<ActivityKind, { bg: string; color: string; icon: typeof UserRound }> = {
  paciente: { bg: 'var(--primary-50)', color: 'var(--primary-700)', icon: UserRound },
  historia: { bg: 'var(--info-50)', color: 'var(--info-600)', icon: FileText },
  cita: { bg: 'var(--warning-50)', color: 'var(--warning-600)', icon: Calendar },
  receta: { bg: 'var(--success-50)', color: 'var(--success-600)', icon: Pill },
  auditoria: { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)', icon: ShieldCheck },
};

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 72 72" className="w-20 h-20 -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--border-primary)" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{clamped}%</span>
      </div>
    </div>
  );
}

function KpiCard({ card, value }: { card: StatCardDef; value: number }) {
  return (
    <Link to={card.to} className="group block rounded-lg p-5 transition-colors hover:border-[var(--primary-300)]"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-50)' }}>
          <card.icon className="w-5 h-5" style={{ color: 'var(--primary-700)' }} />
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
        {value.toLocaleString('es-VE')}
      </p>
      <p className="text-xs font-medium mt-2 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        {card.label}
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const userRole = user?.rol ?? '';
  const [stats, setStats] = useState<DashboardStats>(ZERO_STATS);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      let loaded = false;
      try {
        const dashRes = await reportsService.getDashboard();
        const dash = ((dashRes as { data?: Record<string, number> })?.data ?? dashRes) as Record<string, number>;
        if (dash && dash.totalPacientes !== undefined) {
          setStats({
            pacientes: dash.totalPacientes || 0,
            medicos: dash.totalMedicos || 0,
            citas: dash.totalCitas || 0,
            consultas: dash.totalConsultas || 0,
            citasPendientes: dash.citasPendientes || 0,
            turnosHoy: dash.turnosHoy || 0,
          });
          loaded = true;
        }
      } catch { /* se intenta por recursos individuales */ }

      if (!loaded) {
        const [pacientes, medicos, citas, consultas] = await Promise.all([
          pacienteService.getAll().catch(() => null),
          medicoService.getAll().catch(() => null),
          citaService.getAll().catch(() => null),
          consultaService.getAll().catch(() => null),
        ]);
        const pacientesArr = extractData(pacientes);
        const medicosArr = extractData(medicos);
        const citasArr = extractData(citas);
        const consultasArr = extractData(consultas);
        if (!pacientesArr.length && !medicosArr.length && !citasArr.length && !consultasArr.length) {
          setApiError(true);
        }
        setStats({
          pacientes: pacientesArr.length,
          medicos: medicosArr.length,
          citas: citasArr.length,
          consultas: consultasArr.length,
          citasPendientes: citasArr.filter(c => {
            const e = c.estadoId ?? c.estado?.id;
            return e === 1 || e === '1';
          }).length,
          turnosHoy: citasArr.filter(c => {
            if (!c.fecha) return false;
            return new Date(c.fecha).toDateString() === new Date().toDateString();
          }).length,
        });

        const acts: RecentActivity[] = [];
        const lastPaciente = pacientesArr[pacientesArr.length - 1];
        if (lastPaciente?.createdAt) {
          acts.push({
            type: 'paciente',
            time: new Date(lastPaciente.createdAt).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            text: `Último paciente registrado: ${[lastPaciente.nombre, lastPaciente.apellido].filter(Boolean).join(' ') || '—'}`,
          });
        }
        const ultimaCita = citasArr[citasArr.length - 1];
        if (ultimaCita?.fecha) {
          acts.push({
            type: 'cita',
            time: new Date(ultimaCita.fecha).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            text: `Última cita: ${ultimaCita.paciente ? `${ultimaCita.paciente.nombre ?? ''} ${ultimaCita.paciente.apellido ?? ''}`.trim() : 'agendada'}`,
          });
        }
        setActivity(acts.slice(0, 5));
      }

      if (['admin', 'gerente'].includes(userRole)) {
        try {
          const auditRes = await api.get('/audit', { params: { limit: 5 } });
          const rows = extractData(auditRes);
          if (rows.length > 0) {
            setActivity(rows.slice(0, 5).map(r => ({
              type: 'auditoria' as ActivityKind,
              time: r.createdAt ? new Date(r.createdAt).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
              text: [r.accion, r.entidad].filter(Boolean).join(' · ') || 'Acción registrada',
            })));
          }
        } catch { /* sin permiso de auditoría */ }
      }

      setActualizado(new Date());
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const visibleQuickActions = allQuickActions.filter(a => !a.roles || a.roles.includes(userRole));
  const pendientesPct = stats.citas > 0 ? Math.round((stats.citasPendientes / stats.citas) * 100) : 0;

  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {saludo}{user?.nombre ? `, ${user.nombre}` : ''}
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--text-tertiary)' }}>
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className="capitalize inline-block first-letter:normal-case">{userRole}</span>
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {apiError && (
        <div className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 border"
          style={{ backgroundColor: 'var(--warning-50)', borderColor: 'var(--warning-200)', color: 'var(--warning-700)' }}>
          <Activity className="w-4 h-4 shrink-0" />
          No se pudo obtener datos del servidor. Los indicadores muestran cero hasta restablecer la conexión.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map(card => <KpiCard key={card.key} card={card} value={stats[card.key]} />)}
      </div>

      {/* Operación del día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-lg p-6 flex items-center gap-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <ProgressRing pct={pendientesPct} color="var(--primary-600)" />
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.citasPendientes.toLocaleString('es-VE')}
            </p>
            <p className="text-xs font-medium mt-1 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Citas pendientes</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Programadas por atender</p>
          </div>
        </div>

        <div className="rounded-lg p-6 flex items-center gap-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <ProgressRing pct={Math.min(stats.turnosHoy * 10, 100)} color="var(--success-500)" />
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.turnosHoy.toLocaleString('es-VE')}
            </p>
            <p className="text-xs font-medium mt-1 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Citas de hoy</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Agenda del día en curso</p>
          </div>
        </div>
      </div>

      {/* Acceso rápido + actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label="Acceso rápido" className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <header className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Acceso rápido</h3>
          </header>
          <div className="p-3 space-y-1.5">
            {visibleQuickActions.map(a => (
              <Link key={a.label} to={a.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)] group">
                <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary-50)' }}>
                  <a.icon className="w-4 h-4" style={{ color: 'var(--primary-700)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.label}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{a.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-tertiary)' }} />
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Actividad reciente" className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <header className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Actividad reciente</h3>
            {actualizado && (
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <Clock className="w-3 h-3" />{actualizado.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </header>
          <div className="p-3">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10" style={{ color: 'var(--text-tertiary)' }}>
                <Activity className="w-7 h-7" />
                <p className="text-sm">Sin actividad registrada aún</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {activity.map((a, i) => {
                  const s = activityStyle[a.type] ?? activityStyle.auditoria;
                  const ActIcon = s.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-md">
                      <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: s.bg }}>
                        <ActIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                        {a.time && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.time}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
