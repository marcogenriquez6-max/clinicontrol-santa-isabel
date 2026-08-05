import { useEffect, useState } from 'react';
import { Plus, Activity, HeartPulse } from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, FormSection, Card } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { triageService, type Triage } from '../api/triage.service';

const ESI = [
  { nivel: 1, label: 'E1 — Reanimación (crítico)', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  { nivel: 2, label: 'E2 — Emergencia', cls: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { nivel: 3, label: 'E3 — Urgente', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { nivel: 4, label: 'E4 — Menor urgencia', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { nivel: 5, label: 'E5 — No urgente', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
];
const esiInfo = (n: number) => ESI.find(e => e.nivel === n) || ESI[2];

const ESTADO_LABEL: Record<string, string> = {
  activo: 'Activo', en_espera: 'En espera', en_atencion: 'En atención', completado: 'Completado', cancelado: 'Cancelado',
};

export default function TriajePage() {
  const { pacientes, fetchPacientes } = useStore();
  const [triages, setTriages] = useState<Triage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const res = await triageService.getAll();
      const data: any = res.data;
      setTriages(Array.isArray(data) ? data : (data?.data ?? data?.items ?? []));
    } catch { toast('error', 'Error', 'No se pudieron cargar los triajes'); }
  };

  useEffect(() => { fetchPacientes(); load(); }, []);

  const pacienteNombre = (id: number) => {
    const p = pacientes.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : `Paciente #${id}`;
  };

  const openModal = () => {
    reset({ pacienteId: '', esiNivel: '', temperatura: '', frecuenciaCardiaca: '', presionSistolica: '', presionDiastolica: '', frecuenciaRespiratoria: '', spo2: '', glucosa: '', peso: '', talla: '', motivoConsulta: '' });
    setIsModalOpen(true);
  };

  const num = (v: any) => (v === '' || v === undefined || v === null ? undefined : Number(v));

  const onSubmit = async (data: any) => {
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
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast('error', 'No se pudo registrar', Array.isArray(msg) ? msg.join(' · ') : (msg || 'Revise los datos'));
    } finally { setFormLoading(false); }
  };

  // Orden por prioridad ESI (E1 primero), activos antes que completados
  const ordenados = [...triages].sort((a, b) => a.esiNivel - b.esiNivel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Activity className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Triaje ESI</h1>
            <p className="text-sm text-gray-500">{triages.length} clasificaciones · prioridad por severidad</p>
          </div>
        </div>
        <Button onClick={openModal}><Plus className="w-4 h-4" />Nuevo Triaje</Button>
      </div>

      {/* Leyenda ESI */}
      <div className="flex flex-wrap gap-2">
        {ESI.map(e => (
          <span key={e.nivel} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${e.cls}`}>
            <span className={`w-2 h-2 rounded-full ${e.dot}`} />{e.label}
          </span>
        ))}
      </div>

      {ordenados.length === 0 ? (
        <Card><p className="text-sm text-gray-500 text-center py-8">No hay triajes registrados</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordenados.map(t => {
            const info = esiInfo(t.esiNivel);
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{pacienteNombre(t.pacienteId)}</p>
                    <p className="text-xs text-gray-500">{ESTADO_LABEL[t.estado] || t.estado}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${info.cls}`}>
                    <span className={`w-2 h-2 rounded-full ${info.dot}`} />E{t.esiNivel}
                  </span>
                </div>
                {t.motivoConsulta && <p className="text-sm text-gray-600 mt-2">{t.motivoConsulta}</p>}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600">
                  {t.temperatura != null && <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-gray-400" />T {t.temperatura}°</span>}
                  {t.frecuenciaCardiaca != null && <span>FC {t.frecuenciaCardiaca}</span>}
                  {t.presionArterial && <span>PA {t.presionArterial}</span>}
                  {t.frecuenciaRespiratoria != null && <span>FR {t.frecuenciaRespiratoria}</span>}
                  {t.saturacionOxigeno != null && <span>SpO₂ {t.saturacionOxigeno}%</span>}
                  {t.glucosa != null && <span>Gluc {t.glucosa}</span>}
                </div>
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
          <div className="border-t border-gray-100 pt-5">
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
          <div className="border-t border-gray-100 pt-5">
            <Textarea label="Motivo de consulta" placeholder="Motivo por el que acude el paciente..." {...register('motivoConsulta')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={formLoading}>Registrar Triaje</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
