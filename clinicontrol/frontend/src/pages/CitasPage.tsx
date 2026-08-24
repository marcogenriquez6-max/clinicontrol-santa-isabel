import { useEffect, useState } from 'react';
import { Plus, Pencil, Calendar, XCircle, UserRound, Stethoscope, CalendarDays, Clock, Flag, ChevronDown, CheckCircle2, type LucideIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Button, Modal, Input, StatusBadge, citaEstadoToStatus, Card } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { citaService } from '../api/cita.service';
import { useForm } from 'react-hook-form';
import type { Cita } from '../types';

const campoBase = 'w-full border border-[var(--border-primary)] rounded-xl px-4 py-3 bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-card)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-600)] outline-none transition-all duration-200 text-[var(--text-primary)] text-sm';

function FieldLabel({ icon: Icon, text, required }: { icon: LucideIcon; text: string; required?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
      <Icon className="w-3.5 h-3.5" />
      {text}
      {required && <span className="text-[var(--danger-500)]">*</span>}
    </span>
  );
}

export default function CitasPage() {
  const { citas, fetchCitas, fetchHelpers, fetchPacientes, fetchMedicos, pacientes, medicos, estadosCita, addCita, updateCita } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Cita | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

const CITA_VALIDACIONES = {
  pacienteId: { required: 'El paciente es requerido' },
  medicoId: { required: 'El médico es requerido' },
  fecha: { required: 'La fecha es requerida', validate: (value: string) => !editingCita && new Date(value) < new Date(new Date().toDateString()) ? 'La fecha no puede ser pasada' : true },
  hora: { required: 'La hora es requerida' },
};

  useEffect(() => { fetchCitas(); fetchPacientes(); fetchMedicos(); fetchHelpers(); }, []);

  const handleOpenModal = (cita?: Cita) => {
    setEditingCita(cita || null);
    reset(cita ? {
      pacienteId: cita.pacienteId, medicoId: cita.medicoId,
      fecha: cita.fecha.split('T')[0], hora: new Date(cita.fecha).toTimeString().slice(0, 5),
      estadoId: cita.estadoId,
    } : { pacienteId: '', medicoId: '', estadoId: '1' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: Record<string, string>) => {
    setFormLoading(true);
    try {
      const fechaCompleta = new Date(`${data.fecha}T${data.hora || '00:00'}`).toISOString();
      // Duración estándar de 30 minutos
      const [h, m] = (data.hora || '08:00').split(':').map(Number);
      const finMin = h * 60 + m + 30;
      const horaFin = `${String(Math.floor(finMin / 60) % 24).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

      if (editingCita?.id) {
        await updateCita(editingCita.id, {
          fecha: fechaCompleta,
          horaInicio: data.hora,
          horaFin,
          ...(data.estadoId ? { estadoId: Number(data.estadoId) } : {}),
        });
        toast('success', 'Cita actualizada');
      } else {
        await addCita({
          pacienteId: Number(data.pacienteId),
          medicoId: Number(data.medicoId),
          fecha: fechaCompleta,
          horaInicio: data.hora,
          horaFin,
        });
        toast('success', 'Cita creada correctamente');
      }
      setIsModalOpen(false); fetchCitas();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      toast('error', 'No se pudo guardar la cita', Array.isArray(msg) ? msg.join(' · ') : (msg || 'Revise los datos e intente nuevamente'));
    } finally { setFormLoading(false); }
  };

  const openCancelModal = (cita: Cita) => {
    setCancelTarget(cita);
    setCancelMotivo('');
    setIsCancelModalOpen(true);
  };

  const handleCancelar = async () => {
    if (!cancelTarget?.id) return;
    setFormLoading(true);
    try {
      await citaService.cancel(cancelTarget.id, cancelMotivo || 'Sin motivo');
      toast('success', 'Cita cancelada', cancelMotivo || 'Sin motivo específico');
      setIsCancelModalOpen(false);
      setCancelTarget(null);
      fetchCitas();
    } catch { toast('error', 'Error al cancelar'); } finally { setFormLoading(false); }
  };

  const columns: Column<Cita>[] = [
    { key: 'fecha', header: 'Fecha y Hora', sortable: true, render: (c) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--text-primary)]">{new Date(c.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="text-xs text-[var(--text-secondary)]">{new Date(c.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    )},
    { key: 'paciente', header: 'Paciente', sortable: true, render: (c) => {
      const p = c.paciente || (pacientes || []).find(x => x.id === c.pacienteId);
      return <span className="font-medium text-[var(--text-primary)]">{p ? `${p.nombre} ${p.apellido}` : '—'}</span>;
    } },
    { key: 'medico', header: 'Médico', render: (c) => {
      const m = c.medico || (medicos || []).find(x => x.id === c.medicoId);
      return <span className="text-[var(--text-secondary)]">{m ? `Dr. ${m.nombre} ${m.apellido}` : '—'}</span>;
    } },
    { key: 'estado', header: 'Estado', render: (c) => {
      const est = (typeof c.estado === 'string' ? c.estado : c.estado?.nombre) || 'pendiente';
      return <StatusBadge variant={citaEstadoToStatus(c.estadoId ?? est)}>{est.charAt(0).toUpperCase() + est.slice(1)}</StatusBadge>;
    } },
    { key: 'acciones', header: 'Acciones', align: 'right', render: (c) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => handleOpenModal(c)} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => openCancelModal(c)} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--danger-500)] hover:bg-[var(--danger-50)]">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ];

  const hoy = citas.filter(c => new Date(c.fecha).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Citas"
        subtitle="Agendamiento con validación de disponibilidad"
        stats={[{ label: 'Total', value: citas.length }, { label: 'Hoy', value: hoy.length }]}
        action={<Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4" />Nueva Cita</Button>}
      />

      <Card padding={false}>
        <DataTable columns={columns} data={citas} keyExtractor={(c) => c.id!}
          searchPlaceholder="Buscar por paciente o médico..."
          searchKeys={['paciente.nombre', 'paciente.apellido', 'medico.nombre', 'motivo']}
          className="table-premium"
          filters={[{
            key: 'estado',
            label: 'Estado',
            options: [...new Set(citas.map(c => c.estado?.nombre).filter(Boolean))].map(n => ({ value: n as string, label: n as string })),
            predicate: (c, v) => c.estado?.nombre === v,
          }]} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingCita ? 'Editar Cita' : 'Nueva Cita'} size="lg" accent="primary">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {editingCita && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-50)]/70 border border-[var(--primary-200)] text-xs text-[var(--primary-700)] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              Editando cita #{editingCita.id} — {editingCita.paciente?.nombre || ''} {editingCita.paciente?.apellido || ''}
            </div>
          )}

          {/* Paciente */}
          <div>
            <FieldLabel icon={UserRound} text="Paciente" required />
            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <select className={`${campoBase} pl-10 pr-10 appearance-none cursor-pointer`} {...register('pacienteId', CITA_VALIDACIONES.pacienteId)}>
                <option value="" disabled>Seleccionar paciente...</option>
                {(pacientes || []).map(p => (
                  <option key={p.id} value={String(p.id)}>{`${p.nombre} ${p.apellido}${p.ci ? ` · CI ${p.ci}` : ''}`}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>
            {errors.pacienteId && <p className="mt-1.5 text-xs text-[var(--danger-500)] font-medium">{errors.pacienteId.message as string}</p>}
          </div>

          {/* Médico */}
          <div>
            <FieldLabel icon={Stethoscope} text="Médico" required />
            <div className="relative">
              <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <select className={`${campoBase} pl-10 pr-10 appearance-none cursor-pointer`} {...register('medicoId', CITA_VALIDACIONES.medicoId)}>
                <option value="" disabled>Seleccionar médico...</option>
                {(medicos || []).map(m => (
                  <option key={m.id} value={String(m.id)}>{`Dr. ${m.nombre} ${m.apellido}${m.especialidad?.nombre ? ` · ${m.especialidad.nombre}` : ''}`}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>
            {errors.medicoId && <p className="mt-1.5 text-xs text-[var(--danger-500)] font-medium">{errors.medicoId.message as string}</p>}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={CalendarDays} text="Fecha" required />
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <input type="date" className={`${campoBase} pl-10`} {...register('fecha', CITA_VALIDACIONES.fecha)} />
              </div>
              {errors.fecha && <p className="mt-1.5 text-xs text-[var(--danger-500)] font-medium">{errors.fecha.message as string}</p>}
            </div>
            <div>
              <FieldLabel icon={Clock} text="Hora" required />
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <input type="time" className={`${campoBase} pl-10`} {...register('hora', CITA_VALIDACIONES.hora)} />
              </div>
              {errors.hora && <p className="mt-1.5 text-xs text-[var(--danger-500)] font-medium">{errors.hora.message as string}</p>}
            </div>
          </div>

          {/* Estado */}
          <div>
            <FieldLabel icon={Flag} text="Estado de la cita" />
            <div className="relative">
              <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <select className={`${campoBase} pl-10 pr-10 appearance-none cursor-pointer`} {...register('estadoId')}>
                {(estadosCita || []).map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>
          </div>

          {/* Barra de acciones */}
          <div className="flex justify-end gap-3 pt-5 border-t border-[var(--border-secondary)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--neutral-300)] active:scale-[0.98] transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary-600)] text-white text-sm font-semibold  hover:bg-[var(--primary-700)] hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formLoading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              {editingCita ? 'Actualizar Cita' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Cita" size="sm">
        {cancelTarget && (
          <div className="space-y-5">
            <div className="p-4 bg-[var(--danger-50)] rounded-lg border border-[var(--danger-100)] space-y-2">
              <p className="text-sm font-medium text-red-800">
                {cancelTarget.paciente?.nombre} {cancelTarget.paciente?.apellido}
              </p>
              <p className="text-xs text-[var(--danger-600)]">
                {new Date(cancelTarget.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}
                {new Date(cancelTarget.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                {' · Dr. '}{cancelTarget.medico?.nombre} {cancelTarget.medico?.apellido}
              </p>
            </div>
            <p className="text-xs text-[var(--danger-600)]">Esta acción cancelará la cita y liberará el horario. No se puede deshacer.</p>
            <Input
              label="Motivo de cancelación *"
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
              placeholder="Ej: El paciente solicitó reagendar, emergencia médica..."
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>Volver</Button>
              <Button variant="danger" onClick={handleCancelar} loading={formLoading} disabled={!cancelMotivo}>
                <XCircle className="w-4 h-4" /> Cancelar Cita
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
