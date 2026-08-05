import { useEffect, useState } from 'react';
import { Plus, Pencil, Calendar, XCircle } from 'lucide-react';
import { Button, Modal, Input, Select, FormSection, StatusBadge, citaEstadoToStatus, Card } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { citaService } from '../api/cita.service';
import { useForm } from 'react-hook-form';
import type { Cita } from '../types';

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

  const onSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      const fechaCompleta = new Date(`${data.fecha}T${data.hora || '00:00'}`).toISOString();
      if (editingCita?.id) { await updateCita(editingCita.id, { ...data, fecha: fechaCompleta }); toast('success', 'Cita actualizada'); }
      else { await addCita({ ...data, fecha: fechaCompleta }); toast('success', 'Cita creada'); }
      setIsModalOpen(false); fetchCitas();
    } catch { toast('error', 'Error al guardar'); } finally { setFormLoading(false); }
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
        <span className="text-sm font-medium text-gray-900">{new Date(c.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="text-xs text-gray-500">{new Date(c.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    )},
    { key: 'paciente', header: 'Paciente', sortable: true, render: (c) => {
      const p = c.paciente || (pacientes || []).find(x => x.id === c.pacienteId);
      return <span className="font-medium text-gray-900">{p ? `${p.nombre} ${p.apellido}` : '—'}</span>;
    } },
    { key: 'medico', header: 'Médico', render: (c) => {
      const m = c.medico || (medicos || []).find(x => x.id === c.medicoId);
      return <span className="text-gray-500">{m ? `Dr. ${m.nombre} ${m.apellido}` : '—'}</span>;
    } },
    { key: 'estado', header: 'Estado', render: (c) => {
      const est = (typeof c.estado === 'string' ? c.estado : c.estado?.nombre) || 'pendiente';
      return <StatusBadge variant={citaEstadoToStatus(c.estadoId ?? est)}>{est.charAt(0).toUpperCase() + est.slice(1)}</StatusBadge>;
    } },
    { key: 'acciones', header: 'Acciones', align: 'right', render: (c) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => handleOpenModal(c)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => openCancelModal(c)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ];

  const hoy = citas.filter(c => new Date(c.fecha).toDateString() === new Date().toDateString());
  const pendientes = citas.filter(c => c.estadoId === 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Citas</h1>
            <p className="text-sm text-gray-500">Programación de citas médicas</p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4" />Nueva Cita</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Citas</p>
          <p className="text-2xl font-semibold text-gray-900">{citas.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Citas Hoy</p>
          <p className="text-2xl font-semibold text-gray-900">{hoy.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-2xl font-semibold text-gray-900">{pendientes.length}</p>
        </div>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={citas} keyExtractor={(c) => c.id!}
          searchPlaceholder="Buscar por paciente o médico..."
          searchKeys={['paciente.nombre', 'paciente.apellido', 'medico.nombre']}
          className="table-premium" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingCita ? 'Editar Cita' : 'Nueva Cita'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {editingCita ? <p className="text-sm text-gray-500">Editando cita #{editingCita.id} - {editingCita.paciente?.nombre || ''} {editingCita.paciente?.apellido || ''}</p> : null}
          <FormSection title="Información de la Cita" color="violet">
            <div className="space-y-4">
              <Select label="Paciente" placeholder="Seleccionar paciente..." required options={(pacientes || []).map(p => ({ value: String(p.id), label: `${p.nombre} ${p.apellido} - ${p.ci}` }))} error={errors.pacienteId?.message as string} {...register('pacienteId', CITA_VALIDACIONES.pacienteId)} />
              <Select label="Médico" placeholder="Seleccionar médico..." required options={(medicos || []).map(m => ({ value: String(m.id), label: `Dr. ${m.nombre} ${m.apellido} - ${m.especialidad?.nombre}` }))} error={errors.medicoId?.message as string} {...register('medicoId', CITA_VALIDACIONES.medicoId)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Fecha" type="date" required error={errors.fecha?.message as string} {...register('fecha', CITA_VALIDACIONES.fecha)} />
                <Input label="Hora" type="time" required error={errors.hora?.message as string} {...register('hora', CITA_VALIDACIONES.hora)} />
              </div>
              <Select label="Estado" options={(estadosCita || []).map(e => ({ value: e.id, label: e.nombre }))} {...register('estadoId')} />
            </div>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={formLoading}>{editingCita ? 'Actualizar Cita' : 'Crear Cita'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Cita" size="sm">
        {cancelTarget && (
          <div className="space-y-5">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-2">
              <p className="text-sm font-medium text-red-800">
                {cancelTarget.paciente?.nombre} {cancelTarget.paciente?.apellido}
              </p>
              <p className="text-xs text-red-600">
                {new Date(cancelTarget.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}
                {new Date(cancelTarget.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                {' · Dr. '}{cancelTarget.medico?.nombre} {cancelTarget.medico?.apellido}
              </p>
            </div>
            <p className="text-xs text-red-600">Esta acción cancelará la cita y liberará el horario. No se puede deshacer.</p>
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
