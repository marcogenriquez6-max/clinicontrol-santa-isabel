import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, CalendarDays } from 'lucide-react';
import { Button, Card, Modal, Input, Select } from '../components/ui';
import { toast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { medicoService, agendaService } from '../api/services';
import type { Medico, HorarioMedico, BloqueoAgenda, SlotDisponible } from '../types';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AgendaPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number>(0);
  const [, setHorarios] = useState<HorarioMedico[]>([]);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ fechaInicio: '', fechaFin: '', motivo: '' });
  const [deleteTarget, setDeleteTarget] = useState<BloqueoAgenda | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'horarios' | 'slots' | 'bloqueos'>('horarios');
  const [editHorarios, setEditHorarios] = useState<Record<string, HorarioMedico>>({});

  useEffect(() => {
    medicoService.getAll().then(res => {
      setMedicos(res.data);
      if (res.data.length > 0) setSelectedMedicoId(res.data[0].id!);
    });
  }, []);

  useEffect(() => {
    if (selectedMedicoId) {
      agendaService.getHorarios(selectedMedicoId).then(res => {
        setHorarios(res.data);
        const map: Record<string, HorarioMedico> = {};
        res.data.forEach(h => { map[String(h.diaSemana)] = h; });
        setEditHorarios(map);
      });
      agendaService.getBloqueos(selectedMedicoId).then(res => setBloqueos(res.data));
    }
  }, [selectedMedicoId]);

  useEffect(() => {
    if (selectedMedicoId && fecha) {
      agendaService.getSlots(selectedMedicoId, fecha).then(res => setSlots(res.data));
    }
  }, [selectedMedicoId, fecha]);

  const getHorarioForDay = (dia: number) => editHorarios[String(dia)];

  const updateHorarioField = (dia: number, field: string, value: any) => {
    setEditHorarios(prev => ({
      ...prev,
      [String(dia)]: { ...prev[String(dia)], [field]: value, medicoId: selectedMedicoId, diaSemana: dia },
    }));
  };

  const handleSaveHorarios = async () => {
    try {
      for (const dia of Object.keys(editHorarios)) {
        const h = editHorarios[dia];
        if (h.activo !== false) {
          await agendaService.setHorario(selectedMedicoId, {
            diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFin: h.horaFin,
            horaInicioTarde: h.horaInicioTarde || undefined, horaFinTarde: h.horaFinTarde || undefined,
            duracionSlotMinutos: h.duracionSlotMinutos || 30, activo: h.activo ?? true,
          });
        } else if (h.id) {
          await agendaService.deleteHorario(h.id);
        }
      }
      toast('success', 'Horarios guardados');
      agendaService.getHorarios(selectedMedicoId).then(res => {
        setHorarios(res.data);
        const map: Record<string, HorarioMedico> = {};
        res.data.forEach(h => { map[String(h.diaSemana)] = h; });
        setEditHorarios(map);
      });
    } catch { toast('error', 'Error al guardar horarios'); }
  };

  const handleBlockDate = async () => {
    setFormErrors({});
    if (blockForm.fechaFin < blockForm.fechaInicio) {
      setFormErrors({ rango: 'La fecha fin debe ser mayor o igual a la fecha inicio' });
      return;
    }
    try {
      await agendaService.bloquear(selectedMedicoId, blockForm);
      toast('success', 'Bloqueo creado');
      setIsBlockModalOpen(false);
      setBlockForm({ fechaInicio: '', fechaFin: '', motivo: '' });
      agendaService.getBloqueos(selectedMedicoId).then(res => setBloqueos(res.data));
    } catch { toast('error', 'Error al bloquear'); }
  };

  const handleDeleteBloqueo = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await agendaService.deleteBloqueo(deleteTarget.id);
      toast('success', 'Bloqueo eliminado');
      setDeleteTarget(null);
      agendaService.getBloqueos(selectedMedicoId).then(res => setBloqueos(res.data));
    } catch { toast('error', 'Error al eliminar'); } finally { setDeleteLoading(false); }
  };

  const slotColor = (slot: SlotDisponible) => {
    if (slot.estado === 'bloqueado') return 'bg-[var(--danger-100)] dark:bg-[var(--danger-500)]/10 text-[var(--danger-700)] dark:text-red-300 border-[var(--danger-200)] cursor-not-allowed';
    if (slot.estado === 'ocupado') return 'bg-[var(--bg-tertiary)] dark:bg-gray-500/10 text-[var(--text-tertiary)] border-[var(--border-primary)] cursor-not-allowed';
    return 'bg-[var(--success-50)] dark:bg-[var(--success-500)]/10 text-[var(--success-700)] dark:text-emerald-300 border-[var(--success-200)] hover:bg-[var(--success-100)] dark:hover:bg-[var(--success-500)]/20 cursor-pointer';
  };

  const tabs = [
    { id: 'horarios' as const, label: 'Horarios' },
    { id: 'slots' as const, label: 'Disponibilidad' },
    { id: 'bloqueos' as const, label: 'Bloqueos' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Agenda Médica</h1>
            <p className="text-sm text-gray-500">Gestión de horarios y bloques</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsBlockModalOpen(true)}><Plus className="w-4 h-4" />Nuevo Bloqueo</Button>
      </div>
      <div className="w-72">
        <Select label="Seleccionar Médico" options={[{ value: '', label: 'Seleccionar médico...' }, ...(medicos || []).map(m => ({ value: String(m.id!), label: `Dr. ${m.nombre} ${m.apellido}${m.especialidad ? ` - ${m.especialidad.nombre}` : ''}` }))]} value={String(selectedMedicoId)} onChange={(e) => setSelectedMedicoId(Number(e.target.value))} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-xl animate-in-up" style={{ animationDelay: '100ms' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[var(--bg-card)] text-[var(--primary-600)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'horarios' && (
        <Card title="Horario Semanal" subtitle="Configure los horarios de atención del médico" action={
          <Button variant="primary" size="sm" onClick={handleSaveHorarios}><Calendar className="w-4 h-4" />Guardar Horarios</Button>
        }>
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Activo</th>
                  <th>Mañana Inicio</th>
                  <th>Mañana Fin</th>
                  <th>Tarde Inicio</th>
                  <th>Tarde Fin</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {DIAS.map((dia, idx) => {
                  const h = getHorarioForDay(idx);
                  return (
                    <tr key={idx}>
                      <td className="font-medium text-[var(--text-primary)]">{dia}</td>
                      <td><input type="checkbox" checked={h?.activo ?? false} onChange={(e) => updateHorarioField(idx, 'activo', e.target.checked)} className="rounded border-[var(--border-primary)] text-[var(--primary-500)] focus:ring-[var(--primary-500)]" /></td>
                      <td><input type="time" value={h?.horaInicio || ''} onChange={(e) => updateHorarioField(idx, 'horaInicio', e.target.value)} className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-28" /></td>
                      <td><input type="time" value={h?.horaFin || ''} onChange={(e) => updateHorarioField(idx, 'horaFin', e.target.value)} className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-28" /></td>
                      <td><input type="time" value={h?.horaInicioTarde || ''} onChange={(e) => updateHorarioField(idx, 'horaInicioTarde', e.target.value)} className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-28" /></td>
                      <td><input type="time" value={h?.horaFinTarde || ''} onChange={(e) => updateHorarioField(idx, 'horaFinTarde', e.target.value)} className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-28" /></td>
                      <td>
                        <select value={h?.duracionSlotMinutos || 30} onChange={(e) => updateHorarioField(idx, 'duracionSlotMinutos', Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] appearance-none cursor-pointer transition-all duration-200 outline-none border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] w-24">
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'slots' && (
        <Card title="Slots Disponibles" subtitle="Visualice la disponibilidad de citas para una fecha">
          <div className="mb-4 max-w-xs">
            <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {slots.length === 0 ? (
            <p className="text-[var(--text-tertiary)] text-center py-8">No hay horarios configurados para este día</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {slots.map((slot, idx) => (
                <button key={idx} disabled={!slot.disponible} className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${slotColor(slot)}`}>
                  <Clock className="w-3 h-3 inline mr-1" />{slot.horaInicio}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'bloqueos' && (
        <Card title="Bloqueos de Agenda" subtitle="Gestión de días no laborables" action={
          <Button variant="primary" size="sm" onClick={() => setIsBlockModalOpen(true)}><Plus className="w-4 h-4" />Nuevo Bloqueo</Button>
        }>
          {bloqueos.length === 0 ? (
            <p className="text-[var(--text-tertiary)] text-center py-8">No hay bloqueos registrados</p>
          ) : (
            <div className="space-y-3">
              {bloqueos.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] animate-in-up">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-[var(--danger-500)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{b.motivo}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{new Date(b.fechaInicio).toLocaleDateString()} - {new Date(b.fechaFin).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon onClick={() => setDeleteTarget(b)}>
                    <Trash2 className="w-4 h-4 text-[var(--danger-500)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Nuevo Bloqueo" size="md">
        <div className="space-y-4">
          {selectedMedicoId ? <p className="text-sm text-[var(--text-secondary)]">Bloqueando agenda de: {medicos.find(m => m.id === selectedMedicoId)?.nombre} {medicos.find(m => m.id === selectedMedicoId)?.apellido}</p> : null}
          <Input label="Fecha Inicio *" type="date" value={blockForm.fechaInicio} onChange={(e) => { setBlockForm(f => ({ ...f, fechaInicio: e.target.value })); setFormErrors({}); }} />
          <Input label="Fecha Fin *" type="date" value={blockForm.fechaFin} onChange={(e) => { setBlockForm(f => ({ ...f, fechaFin: e.target.value })); setFormErrors({}); }} />
          <Input label="Motivo *" value={blockForm.motivo} onChange={(e) => { setBlockForm(f => ({ ...f, motivo: e.target.value })); setFormErrors({}); }} placeholder="Ej: Vacaciones, Capacitación..." />
          {formErrors.rango && <p className="text-sm text-[var(--danger-500)]">{formErrors.rango}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsBlockModalOpen(false); setFormErrors({}); }}>Cancelar</Button>
            <Button variant="primary" onClick={handleBlockDate} disabled={!blockForm.fechaInicio || !blockForm.fechaFin || !blockForm.motivo || blockForm.motivo.length < 3 || blockForm.fechaFin < blockForm.fechaInicio}>
              <Plus className="w-4 h-4" />Crear Bloqueo
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBloqueo}
        title="Eliminar Bloqueo"
        message="¿Está seguro de eliminar este bloqueo?"
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
