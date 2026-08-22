import { useEffect, useState } from 'react';
import { Plus, BedDouble, LogOut, FileText } from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, FormSection, Card } from '../components/ui';
import PageHeader from '../components/ui/PageHeader';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { hospitalizacionService, camaService, type Hospitalizacion, type Cama, type HospStats } from '../api/hospitalizacion.service';

const CAMA_CLS: Record<string, string> = {
  disponible: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  ocupado: 'bg-red-50 border-red-200 text-red-700',
  reservado: 'bg-amber-50 border-amber-200 text-amber-700',
  limpieza: 'bg-blue-50 border-blue-200 text-blue-700',
  mantenimiento: 'bg-gray-100 border-gray-200 text-gray-500',
};
const ESTADO_HOSP: Record<string, string> = {
  admitido: 'Admitido', en_observacion: 'En observación', internado: 'Internado', alta: 'De alta', traslado: 'Traslado', fallecido: 'Fallecido',
};

export default function HospitalizacionPage() {
  const { pacientes, fetchPacientes, medicos, fetchMedicos } = useStore();
  const [hosp, setHosp] = useState<Hospitalizacion[]>([]);
  const [camas, setCamas] = useState<Cama[]>([]);
  const [stats, setStats] = useState<HospStats | null>(null);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [altaTarget, setAltaTarget] = useState<Hospitalizacion | null>(null);
  const [notaTarget, setNotaTarget] = useState<Hospitalizacion | null>(null);
  const [loading, setLoading] = useState(false);

  const ingresoForm = useForm();
  const altaForm = useForm();
  const notaForm = useForm();

  const arr = (r: any) => { const d = r?.data ?? r; return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []); };

  const load = async () => {
    try {
      const [h, c, s] = await Promise.all([
        hospitalizacionService.getAll().catch(() => null),
        camaService.getAll().catch(() => null),
        hospitalizacionService.getStats().catch(() => null),
      ]);
      setHosp(arr(h)); setCamas(arr(c)); setStats((s?.data ?? s) as HospStats | null);
    } catch { toast('error', 'Error', 'No se pudo cargar hospitalización'); }
  };

  useEffect(() => { fetchPacientes(); fetchMedicos(); load(); }, []);

  const pName = (id: number) => { const p = pacientes.find(x => x.id === id); return p ? `${p.nombre} ${p.apellido}` : `Paciente #${id}`; };
  const mName = (id: number) => { const m = medicos.find(x => x.id === id); return m ? `Dr. ${m.nombre} ${m.apellido}` : `Médico #${id}`; };
  const cName = (id: number) => { const c = camas.find(x => x.id === id); return c ? c.codigoCama : `Cama #${id}`; };
  const activos = hosp.filter(h => h.estado !== 'alta' && !h.fechaAlta);
  const camasLibres = camas.filter(c => c.estado === 'disponible');

  const onIngreso = async (data: any) => {
    setLoading(true);
    try {
      await hospitalizacionService.create({
        pacienteId: Number(data.pacienteId),
        medicoTratanteId: Number(data.medicoTratanteId),
        camaId: Number(data.camaId),
        fechaIngreso: new Date().toISOString(),
        motivoIngreso: data.motivoIngreso,
        diagnosticoIngreso: data.diagnosticoIngreso || undefined,
      });
      toast('success', 'Ingreso registrado', 'El paciente fue admitido y la cama asignada');
      setIngresoOpen(false); load();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast('error', 'No se pudo admitir', Array.isArray(msg) ? msg.join(' · ') : (msg || 'Revise los datos'));
    } finally { setLoading(false); }
  };

  const onAlta = async (data: any) => {
    if (!altaTarget?.id) return;
    setLoading(true);
    try {
      await hospitalizacionService.alta(altaTarget.id, {
        fechaAlta: new Date().toISOString(),
        diagnosticoAlta: data.diagnosticoAlta || undefined,
        notasAlta: data.notasAlta || undefined,
      });
      toast('success', 'Alta registrada', 'La cama queda disponible nuevamente');
      setAltaTarget(null); load();
    } catch (e: any) {
      toast('error', 'No se pudo dar de alta', e?.response?.data?.message || 'Intente nuevamente');
    } finally { setLoading(false); }
  };

  const onNota = async (data: any) => {
    if (!notaTarget?.id) return;
    setLoading(true);
    try {
      await hospitalizacionService.addNota(notaTarget.id, {
        fecha: new Date().toISOString().slice(0, 10),
        nota: data.nota,
        plan: data.plan || undefined,
        indicaciones: data.indicaciones || undefined,
      });
      toast('success', 'Nota de evolución agregada');
      setNotaTarget(null); notaForm.reset();
    } catch (e: any) {
      toast('error', 'No se pudo agregar la nota', e?.response?.data?.message || 'Intente nuevamente');
    } finally { setLoading(false); }
  };

  const kpis = [
    { label: 'Camas totales', value: stats?.totalCamas ?? camas.length },
    { label: 'Ocupadas', value: stats?.ocupadas ?? camas.filter(c => c.estado === 'ocupado').length },
    { label: 'Disponibles', value: stats?.disponibles ?? camasLibres.length },
    { label: '% Ocupación', value: `${stats?.ocupacion ?? 0}%` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BedDouble}
        title="Hospitalización"
        subtitle="Ingresos, altas y control de ocupación de camas"
        stats={[{ label: 'Internados', value: activos.length }, { label: 'Camas libres', value: camasLibres.length }]}
        action={<Button onClick={() => { ingresoForm.reset({ pacienteId: '', medicoTratanteId: '', camaId: '', motivoIngreso: '', diagnosticoIngreso: '' }); setIngresoOpen(true); }} disabled={camasLibres.length === 0}>
          <Plus className="w-4 h-4" />Nuevo Ingreso
        </Button>}
      />

      {/* KPIs de ocupación */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}><p className="text-xs text-gray-500 uppercase tracking-wide">{k.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p></Card>
        ))}
      </div>

      {/* Mapa de camas */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Estado de camas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {camas.map(c => (
            <div key={c.id} className={`rounded-lg border p-3 ${CAMA_CLS[c.estado] || 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" /><span className="font-semibold text-sm">{c.codigoCama}</span></div>
              <p className="text-xs mt-1">{c.servicio}</p>
              <p className="text-[11px] capitalize mt-0.5 opacity-80">{c.estado}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Internados */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Pacientes internados</h3>
        {activos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No hay pacientes internados</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activos.map(h => (
              <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{pName(h.pacienteId)}</p>
                  <p className="text-xs text-gray-500 truncate">{cName(h.camaId)} · {mName(h.medicoTratanteId)} · {ESTADO_HOSP[h.estado] || h.estado}</p>
                  {h.motivoIngreso && <p className="text-sm text-gray-600 mt-0.5 truncate">{h.motivoIngreso}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { notaForm.reset({ nota: '', plan: '', indicaciones: '' }); setNotaTarget(h); }} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100"><FileText className="w-3.5 h-3.5" />Nota</button>
                  <button onClick={() => { altaForm.reset({ diagnosticoAlta: '', notasAlta: '' }); setAltaTarget(h); }} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-blue-600 hover:bg-blue-50"><LogOut className="w-3.5 h-3.5" />Alta</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal: Nuevo Ingreso */}
      <Modal isOpen={ingresoOpen} onClose={() => setIngresoOpen(false)} title="Nuevo Ingreso Hospitalario" size="lg">
        <form onSubmit={ingresoForm.handleSubmit(onIngreso)} className="space-y-5">
          <FormSection title="Datos del ingreso" color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Paciente" placeholder="Seleccionar..." required
                options={(pacientes || []).filter(p => p.id !== undefined).map(p => ({ value: p.id!, label: `${p.nombre} ${p.apellido} — ${p.ci}` }))}
                error={ingresoForm.formState.errors.pacienteId?.message as string} {...ingresoForm.register('pacienteId', { required: 'Paciente requerido' })} />
              <Select label="Médico tratante" placeholder="Seleccionar..." required
                options={(medicos || []).filter(m => m.id !== undefined).map(m => ({ value: m.id!, label: `Dr. ${m.nombre} ${m.apellido}` }))}
                error={ingresoForm.formState.errors.medicoTratanteId?.message as string} {...ingresoForm.register('medicoTratanteId', { required: 'Médico requerido' })} />
              <Select label="Cama disponible" placeholder="Seleccionar..." required
                options={camasLibres.map(c => ({ value: c.id, label: `${c.codigoCama} — ${c.servicio}` }))}
                error={ingresoForm.formState.errors.camaId?.message as string} {...ingresoForm.register('camaId', { required: 'Cama requerida' })} />
            </div>
          </FormSection>
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <Input label="Motivo de ingreso" placeholder="Motivo de la internación" required
              error={ingresoForm.formState.errors.motivoIngreso?.message as string} {...ingresoForm.register('motivoIngreso', { required: 'Motivo requerido' })} />
            <Textarea label="Diagnóstico de ingreso" placeholder="Diagnóstico presuntivo (opcional)" {...ingresoForm.register('diagnosticoIngreso')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIngresoOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Registrar Ingreso</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Dar de Alta */}
      <Modal isOpen={!!altaTarget} onClose={() => setAltaTarget(null)} title="Dar de Alta" size="md">
        {altaTarget && <p className="text-sm text-gray-500 mb-4">Paciente: <strong>{pName(altaTarget.pacienteId)}</strong> · {cName(altaTarget.camaId)}</p>}
        <form onSubmit={altaForm.handleSubmit(onAlta)} className="space-y-4">
          <Textarea label="Diagnóstico de alta" placeholder="Diagnóstico final" {...altaForm.register('diagnosticoAlta')} />
          <Textarea label="Notas / indicaciones de alta" placeholder="Indicaciones al paciente" {...altaForm.register('notasAlta')} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setAltaTarget(null)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Confirmar Alta</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nota de evolución */}
      <Modal isOpen={!!notaTarget} onClose={() => setNotaTarget(null)} title="Nota de Evolución" size="md">
        {notaTarget && <p className="text-sm text-gray-500 mb-4">Paciente: <strong>{pName(notaTarget.pacienteId)}</strong></p>}
        <form onSubmit={notaForm.handleSubmit(onNota)} className="space-y-4">
          <Textarea label="Evolución" placeholder="Evolución clínica del paciente" required
            error={notaForm.formState.errors.nota?.message as string} {...notaForm.register('nota', { required: 'La nota es requerida' })} />
          <Textarea label="Plan" placeholder="Plan de manejo (opcional)" {...notaForm.register('plan')} />
          <Textarea label="Indicaciones" placeholder="Indicaciones (opcional)" {...notaForm.register('indicaciones')} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setNotaTarget(null)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Guardar Nota</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
