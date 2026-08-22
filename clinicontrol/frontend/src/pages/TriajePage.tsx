import { useEffect, useState } from 'react';
import { Plus, Activity, HeartPulse, Timer, AlertOctagon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Button, Modal, Input, Select, Textarea, FormSection, Card, EsiBadge, esiMeta } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { triageService, type Triage } from '../api/triage.service';

const ESI = [
  { nivel: 1, label: 'E1 — Reanimación (crítico)' },
  { nivel: 2, label: 'E2 — Emergencia' },
  { nivel: 3, label: 'E3 — Urgente' },
  { nivel: 4, label: 'E4 — Menor urgencia' },
  { nivel: 5, label: 'E5 — No urgente' },
];

const ESTADO_LABEL: Record<string, string> = {
  activo: 'Activo', en_espera: 'En espera', en_atencion: 'En atención', completado: 'Completado', cancelado: 'Cancelado',
};

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface TriajeFormValues {
  pacienteId: string;
  esiNivel: string;
  temperatura?: string;
  frecuenciaCardiaca?: string;
  presionSistolica?: string;
  presionDiastolica?: string;
  frecuenciaRespiratoria?: string;
  spo2?: string;
  glucosa?: string;
  peso?: string;
  talla?: string;
  motivoConsulta?: string;
}

export default function TriajePage() {
  const { pacientes, fetchPacientes } = useStore();
  const [triages, setTriages] = useState<Triage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const now = useNow();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TriajeFormValues>();

  const load = async () => {
    try {
      const res = await triageService.getAll();
      const payload = res.data as unknown;
      const data = Array.isArray(payload)
        ? (payload as Triage[])
        : ((payload as { data?: Triage[] })?.data ?? (payload as { items?: Triage[] })?.items ?? []);
      setTriages(data);
    } catch { toast('error', 'Error', 'No se pudieron cargar los triajes'); }
  };

  useEffect(() => {
    const init = async () => {
      fetchPacientes();
      await load();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pacienteNombre = (id: number) => {
    const p = pacientes.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : `Paciente #${id}`;
  };

  const espera = (t: Triage) => {
    if (!t.fechaHora || t.estado === 'completado' || t.estado === 'cancelado') return null;
    const inicio = new Date(t.fechaHora).getTime();
    if (Number.isNaN(inicio)) return null;
    return Math.max(0, Math.floor((now - inicio) / 60000));
  };

  const openModal = () => {
    reset({ pacienteId: '', esiNivel: '', temperatura: '', frecuenciaCardiaca: '', presionSistolica: '', presionDiastolica: '', frecuenciaRespiratoria: '', spo2: '', glucosa: '', peso: '', talla: '', motivoConsulta: '' });
    setIsModalOpen(true);
  };

  const num = (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? undefined : Number(v);

  const onSubmit = async (data: TriajeFormValues) => {
    setFormLoading(true);
    try {
      await triageService.create({
        pacienteId: Number(data.pacienteId),
        esiNivel: Number(data.esiNivel),
        temperatura: num(data.temperatura),
        frecuenciaCardiaca: num(data.frecuenciaCardiaca),
        presionSistolica: num(data.presionSistolica),
        presionDiastolica: num(data.presionDiastolica),
        frecuenciaRespiratoria: num(data.frecuenciaRespiratoria),
        spo2: num(data.spo2),
        peso: num(data.peso),
        talla: num(data.talla),
        motivoConsulta: data.motivoConsulta || undefined,
      });
      toast('success', 'Triaje registrado', 'El paciente fue clasificado por prioridad ESI');
      setIsModalOpen(false);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      toast('error', 'No se pudo registrar', Array.isArray(msg) ? msg.join(' · ') : String(msg ?? 'Revise los datos'));
    } finally { setFormLoading(false); }
  };

  // Orden por prioridad ESI (E1 primero)
  const ordenados = [...triages].sort((a, b) => a.esiNivel - b.esiNivel);

  const conteo = [1, 2, 3, 4, 5].map((n) => ({
    nivel: n,
    total: ordenados.filter((t) => t.esiNivel === n && t.estado !== 'completado' && t.estado !== 'cancelado').length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Triaje ESI"
        subtitle="Clasificación por severidad — prioridad de urgencias"
        stats={[{ label: 'Clasificados', value: ordenados.length }]}
        action={<Button onClick={openModal}><Plus className="w-4 h-4" />Nuevo Triaje</Button>}
      />

      {/* Tarjetas de severidad E1–E5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {conteo.map(({ nivel, total }) => {
          const meta = esiMeta(nivel);
          return (
            <div key={nivel} className="rounded-xl p-4 border-l-4 shadow-sm"
              style={{ backgroundColor: meta.bg, borderLeftColor: meta.accent }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold" style={{ color: meta.text }}>{meta.label} · {meta.desc}</span>
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: meta.text }}>{total}</p>
              <p className="text-[11px] mt-0.5" style={{ color: meta.text }}>
                {meta.maxWaitMin === 0 ? 'Atención inmediata' : `Espera máx. ${meta.maxWaitMin} min`}
              </p>
            </div>
          );
        })}
      </div>

      {ordenados.length === 0 ? (
        <Card><p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No hay triajes registrados</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordenados.map((t) => {
            const meta = esiMeta(t.esiNivel);
            const min = espera(t);
            const vencido = min != null && meta.maxWaitMin > 0 && min > meta.maxWaitMin;
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pacienteNombre(t.pacienteId)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ESTADO_LABEL[t.estado] || t.estado}</p>
                  </div>
                  <EsiBadge nivel={t.esiNivel} />
                </div>
                {t.motivoConsulta && <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{t.motivoConsulta}</p>}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t.temperatura != null && <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />T {t.temperatura}°</span>}
                  {t.frecuenciaCardiaca != null && <span>FC {t.frecuenciaCardiaca}</span>}
                  {t.presionArterial && <span>PA {t.presionArterial}</span>}
                  {t.frecuenciaRespiratoria != null && <span>FR {t.frecuenciaRespiratoria}</span>}
                  {t.saturacionOxigeno != null && <span>SpO₂ {t.saturacionOxigeno}%</span>}
                  {t.glucosa != null && <span>Gluc {t.glucosa}</span>}
                </div>
                {min != null && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: vencido ? 'var(--alert-critical-bg)' : 'var(--bg-secondary)',
                      color: vencido ? 'var(--alert-critical-text)' : 'var(--text-secondary)',
                      border: `1px solid ${vencido ? 'var(--alert-critical-accent)' : 'transparent'}`,
                    }}
                  >
                    {vencido
                      ? <AlertOctagon className="w-3.5 h-3.5" />
                      : <Timer className="w-3.5 h-3.5" />}
                    {min < 60 ? `${min} min en espera` : `${Math.floor(min / 60)} h ${min % 60} min`}
                    {vencido && ' · superó tiempo máximo'}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Triaje ESI" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSection title="Paciente y prioridad" color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Paciente" placeholder="Seleccionar paciente..." required
                options={(pacientes || []).filter(p => p.id !== undefined).map(p => ({ value: p.id!, label: `${p.nombre} ${p.apellido} — ${p.ci}` }))}
                error={errors.pacienteId?.message as string} {...register('pacienteId', { required: 'El paciente es requerido' })} />
              <Select label="Nivel ESI" placeholder="Clasificar..." required
                options={ESI.map(e => ({ value: e.nivel, label: e.label }))}
                error={errors.esiNivel?.message as string} {...register('esiNivel', { required: 'El nivel ESI es requerido' })} />
            </div>
          </FormSection>
          <div className="border-t pt-5" style={{ borderColor: 'var(--border-secondary)' }}>
            <FormSection title="Signos vitales" color="emerald">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Temperatura (°C)" type="number" step="0.1" placeholder="36.5" {...register('temperatura')} />
                <Input label="F. Cardiaca" type="number" placeholder="80" {...register('frecuenciaCardiaca')} />
                <Input label="PA Sistólica" type="number" placeholder="120" {...register('presionSistolica')} />
                <Input label="PA Diastólica" type="number" placeholder="80" {...register('presionDiastolica')} />
                <Input label="F. Respiratoria" type="number" placeholder="16" {...register('frecuenciaRespiratoria')} />
                <Input label="SpO₂ (%)" type="number" placeholder="98" {...register('spo2')} />
                <Input label="Peso (kg)" type="number" step="0.1" placeholder="70" {...register('peso')} />
              </div>
            </FormSection>
          </div>
          <div className="border-t pt-5" style={{ borderColor: 'var(--border-secondary)' }}>
            <Textarea label="Motivo de consulta" placeholder="Motivo por el que acude el paciente..." {...register('motivoConsulta')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={formLoading}>Registrar Triaje</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
