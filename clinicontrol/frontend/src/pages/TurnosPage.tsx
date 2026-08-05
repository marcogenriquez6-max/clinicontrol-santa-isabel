import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Ticket, Printer, Users, Eye, Play, CheckCircle, XCircle, Monitor, DollarSign } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Badge } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import { turnoService, medicoService, pacienteService } from '../api/services';
import type { Turno } from '../types';

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [, setShowRegistro] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState(0);
  const [turnoActual, setTurnoActual] = useState<any | null>(null);
  const [showConfirmPago, setShowConfirmPago] = useState(false);
  const [modalTurno, setModalTurno] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nombre: '', ci: '', telefono: '', tipo: 'consulta' as 'consulta' | 'examen' | 'vacuna',
  });
  const [activeSection, setActiveSection] = useState<'caja' | 'sala' | 'pantalla'>('caja');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turnosRes, medicosRes] = await Promise.all([
          turnoService.getAll({ limit: 100 }),
          medicoService.getAll(),
        ]);
        setTurnos(Array.isArray(turnosRes) ? turnosRes : (turnosRes as any)?.data ?? []);
        setMedicos(Array.isArray(medicosRes) ? medicosRes : (medicosRes as any)?.data ?? []);
      } catch {}
    };
    fetchData();
  }, []);

  const generarTurno = async () => {
    if (!formData.nombre || !formData.ci || selectedMedico === -1) {
      toast('warning', 'Complete los datos del paciente y seleccione un médico');
      return;
    }
    const medico = medicos[selectedMedico];
    try {
      const res = await pacienteService.create({
        nombre: formData.nombre,
        ci: formData.ci,
        telefono: formData.telefono || undefined,
      });
      const paciente = res.data ?? res;
      const turnoRes = await turnoService.create({
        pacienteId: paciente.id!,
        medicoId: medico.id,
        monto: formData.tipo === 'consulta' ? 200 : formData.tipo === 'examen' ? 350 : 150,
        tipo: formData.tipo,
        pagado: false,
      });
      const creado = turnoRes.data ?? turnoRes;
      setTurnos(prev => [...prev, creado]);
      setTurnoActual(creado);
      setShowConfirmPago(true);
      toast('success', `Turno #${creado.numero} generado`, `Paciente: ${formData.nombre}`);
    } catch (e: any) {
      toast('error', 'Error al generar turno', e?.response?.data?.message || 'Intente nuevamente');
    }
  };

  const confirmarPago = async () => {
    if (!turnoActual) return;
    try {
      await turnoService.marcarPagado(turnoActual.id);
      setTurnos(prev => prev.map((t: any) => t.id === turnoActual.id ? { ...t, pagado: true } : t));
      setShowConfirmPago(false);
      setShowRegistro(false);
      setFormData({ nombre: '', ci: '', telefono: '', tipo: 'consulta' });
      toast('success', 'Pago registrado', 'Ticket generado - puede imprimirlo');
      setTimeout(() => window.print(), 500);
    } catch {
      toast('error', 'Error al registrar pago');
    }
  };

  const llamarTurno = async (turno: any) => {
    try {
      await turnoService.updateEstado(turno.id, 'llamado');
      setTurnos(prev => prev.map((t: any) => t.id === turno.id ? { ...t, estado: 'llamado' } : t));
      toast('info', `Turno #${turno.numero} llamado`, `Consultorio ${turno.consultorio}`);
    } catch {
      toast('error', 'Error al llamar turno');
    }
  };

  const iniciarAtencion = async (turno: any) => {
    try {
      await turnoService.updateEstado(turno.id, 'atencion');
      setTurnos(prev => prev.map((t: any) => t.id === turno.id ? { ...t, estado: 'atencion' } : t));
      toast('success', `Atendiendo turno #${turno.numero}`);
    } catch {
      toast('error', 'Error al iniciar atención');
    }
  };

  const completarTurno = async (turno: any) => {
    try {
      await turnoService.updateEstado(turno.id, 'completado');
      setTurnos(prev => prev.map((t: any) => t.id === turno.id ? { ...t, estado: 'completado' } : t));
      toast('success', `Turno #${turno.numero} completado`);
    } catch {
      toast('error', 'Error al completar turno');
    }
  };

  const cancelarTurno = async (turno: any) => {
    try {
      await turnoService.updateEstado(turno.id, 'cancelado');
      setTurnos(prev => prev.map((t: any) => t.id === turno.id ? { ...t, estado: 'cancelado' } : t));
      toast('info', `Turno #${turno.numero} cancelado`);
    } catch {
      toast('error', 'Error al cancelar turno');
    }
  };

  const turnosEnEspera = turnos.filter(t => t.estado === 'espera' && t.pagado);
  const turnosLlamados = turnos.filter(t => t.estado === 'llamado');
  const turnosAtencion = turnos.filter(t => t.estado === 'atencion');
  const turnosPendientesPago = turnos.filter(t => !t.pagado);

  const estadoBadge = (estado: Turno['estado']) => {
    const map = {
      espera: { variant: 'warning' as const, label: 'En Espera' },
      llamado: { variant: 'info' as const, label: 'Llamado' },
      atencion: { variant: 'primary' as const, label: 'En Atención' },
      completado: { variant: 'success' as const, label: 'Completado' },
      cancelado: { variant: 'danger' as const, label: 'Cancelado' },
    };
    return <Badge variant={map[estado].variant}>{map[estado].label}</Badge>;
  };

  const TicketPreview = ({ turno }: { turno: Turno }) => (
      <div ref={printRef} className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-primary)] max-w-xs mx-auto" style={{ fontFamily: 'monospace' }}>
      <div className="text-center border-b border-dashed border-[var(--border-primary)] pb-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Ticket className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Clínica Santa Isabel</h3>
        <p className="text-xs text-[var(--text-tertiary)]">Sistema de Gestión Hospitalaria</p>
      </div>
      <div className="text-center mb-4">
        <p className="text-5xl font-bold text-[var(--primary-600)] mb-1">#{String(turno.numero).padStart(3, '0')}</p>
        <p className="text-sm text-[var(--text-tertiary)]">{new Date().toLocaleDateString('es-ES')}</p>
      </div>
      <div className="space-y-2 text-sm border-t border-dashed border-[var(--border-primary)] pt-4">
        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Paciente:</span><span className="font-medium text-[var(--text-primary)]">{turno.pacienteNombre}</span></div>
        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Médico:</span><span className="font-medium text-[var(--text-primary)]">{turno.medicoNombre}</span></div>
        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Consultorio:</span><span className="font-medium text-[var(--text-primary)]">{turno.consultorio}</span></div>
        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Especialidad:</span><span className="font-medium text-[var(--text-primary)]">{turno.especialidad}</span></div>
        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Tipo:</span><span className="font-medium text-[var(--text-primary)]">{turno.tipo === 'consulta' ? 'Consulta' : turno.tipo === 'examen' ? 'Examen' : 'Vacuna'}</span></div>
        <div className="flex justify-between border-t border-dashed border-[var(--border-primary)] pt-2 mt-2">
          <span className="text-[var(--text-tertiary)]">Monto Pagado:</span>
          <span className="font-bold text-[var(--success-600)]">Bs. {Number(turno.monto).toFixed(2)}</span>
        </div>
      </div>
      <div className="text-center text-[10px] text-[var(--text-tertiary)] border-t border-dashed border-[var(--border-primary)] pt-3 mt-4">
        <p>Gracias por su preferencia</p>
        <p>Presentar este ticket en su consulta</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader icon={ClipboardList} gradient="from-blue-500 to-indigo-600" title="Turnos" subtitle="Gestión de turnos" stats={[{ label: 'En espera', value: turnosEnEspera.length }, { label: 'En atención', value: turnosAtencion.length }]} />

      {/* Secciones */}
      <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-xl">
        {[
          { id: 'caja' as const, label: '💰 Caja / Admisión', icon: DollarSign },
          { id: 'sala' as const, label: '🩺 Sala de Espera', icon: Users },
          { id: 'pantalla' as const, label: '📺 Pantalla TV', icon: Monitor },
        ].map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === sec.id ? 'bg-[var(--bg-primary)] text-[var(--primary-600)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
            {sec.label}
          </button>
        ))}
      </div>

      {/* SECCIÓN CAJA */}
      {activeSection === 'caja' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in-up animation-delay-100">
            {/* Registro de Turno */}
            <div className="lg:col-span-1">
              <Card title="Registrar Nuevo Turno" subtitle="Datos del paciente" accent="primary" className="animate-in-up animation-delay-200">
              <div className="space-y-4">
                <Input label="Nombre del Paciente *" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))} />
                <Input label="Cédula de Identidad *" placeholder="1234567" value={formData.ci} onChange={e => setFormData(f => ({ ...f, ci: e.target.value }))} />
                <Input label="Teléfono" placeholder="77712345" value={formData.telefono} onChange={e => setFormData(f => ({ ...f, telefono: e.target.value }))} />
                <Select label="Tipo de Atención" value={formData.tipo} onChange={e => setFormData(f => ({ ...f, tipo: e.target.value as any }))}
                  options={[
                    { value: 'consulta', label: '🩺 Consulta Médica - Bs. 200' },
                    { value: 'examen', label: '🔬 Examen / Laboratorio - Bs. 350' },
                    { value: 'vacuna', label: '💉 Vacuna - Bs. 150' },
                  ]}
                />
                <Select label="Seleccionar Médico" value={selectedMedico} onChange={e => setSelectedMedico(Number(e.target.value))}
                  options={[
                    { value: -1, label: 'Seleccionar médico...' },
                    ...medicos.map((m, i) => ({ value: i, label: `${m.nombre} ${m.apellido} - ${m.especialidad?.nombre || ''}` })),
                  ]}
                />
                <Button className="w-full" size="lg" variant="premium" onClick={generarTurno}>
                  <Ticket className="w-4 h-4" />
                  Generar Turno y Cobrar
                </Button>
              </div>
            </Card>
          </div>

          {/* Turnos Pendientes de Pago / Recientes */}
          <div className="lg:col-span-2 space-y-6">
            {turnosPendientesPago.length > 0 && (
              <Card title={`⏳ ${turnosPendientesPago.length} pendiente(s) de pago`} subtitle="Pacientes registrados que aún no pagaron" accent="warning" className="animate-in-up animation-delay-300">
                <div className="space-y-3">
                  {turnosPendientesPago.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--warning-50)] border border-[var(--warning-200)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--warning-100)] flex items-center justify-center text-lg font-bold text-[var(--warning-600)]">#{t.numero}</div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{t.medicoNombre} · Bs. {Number(t.monto).toFixed(2)}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="premium" onClick={() => { setTurnoActual(t); setShowConfirmPago(true); }}>
                        <DollarSign className="w-4 h-4" />Cobrar Bs. {t.monto}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Últimos turnos */}
            <Card title="📋 Últimos Turnos" subtitle="Registro de turnos generados hoy" accent="accent" className="animate-in-up animation-delay-400">
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Paciente</th>
                      <th>Médico</th>
                      <th>Estado</th>
                      <th>Pago</th>
                      <th align="right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...turnos].reverse().slice(0, 10).map(t => (
                      <tr key={t.id}>
                        <td className="font-bold text-lg">#{t.numero}</td>
                        <td>
                          <p className="font-medium text-[var(--text-primary)]">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{t.pacienteCI}</p>
                        </td>
                        <td className="text-sm">{t.medicoNombre}</td>
                        <td>{estadoBadge(t.estado)}</td>
                        <td>{t.pagado ? <Badge variant="success">Pagado Bs. {t.monto}</Badge> : <Badge variant="danger">Pendiente</Badge>}</td>
                        <td align="right">
                          <Button variant="ghost" size="sm" icon onClick={() => setModalTurno(t)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECCIÓN SALA DE ESPERA */}
      {activeSection === 'sala' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in-up animation-delay-100">
          <Card title="🟡 En Espera" subtitle={`${turnosEnEspera.length} paciente(s) esperando`} accent="warning" className="animate-in-up animation-delay-200">
            {turnosEnEspera.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">No hay pacientes en espera</div>
            ) : (
              <div className="space-y-3">
                {turnosEnEspera.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--primary-300)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-sm">
                        #{t.numero}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{t.pacienteNombre}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{t.medicoNombre} · Cons. {t.consultorio}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => llamarTurno(t)}>
                      <Play className="w-4 h-4" />Llamar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="🔵 Llamados" subtitle="Pacientes notificados" accent="accent" className="animate-in-up animation-delay-300">
              {turnosLlamados.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">Sin pacientes llamados</div>
              ) : (
                <div className="space-y-2">
                  {turnosLlamados.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--info-50)] border border-[var(--info-200)]">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[var(--info-500)]">#{t.numero}</span>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Cons. {t.consultorio}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="primary" onClick={() => iniciarAtencion(t)}>
                        <CheckCircle className="w-4 h-4" />Iniciar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="🟢 En Atención" subtitle="Consultas en curso" accent="success" className="animate-in-up animation-delay-400">
              {turnosAtencion.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">Sin pacientes en atención</div>
              ) : (
                <div className="space-y-2">
                  {turnosAtencion.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--success-50)] border border-[var(--success-200)]">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[var(--success-500)] animate-pulse" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">#{t.numero} - {t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{t.medicoNombre}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="success" onClick={() => completarTurno(t)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelarTurno(t)}>
                          <XCircle className="w-4 h-4 text-[var(--danger-500)]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* SECCIÓN PANTALLA TV */}
      {activeSection === 'pantalla' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-[var(--shadow-md)] overflow-hidden animate-in-up animation-delay-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-center">
            <Monitor className="w-12 h-12 text-white/50 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-white mb-2">Clínica Santa Isabel</h2>
            <p className="text-blue-200 text-lg">Sistema de Turnos en Tiempo Real</p>
            <p className="text-blue-300 text-sm mt-2">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* En Espera */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--warning-500)]" />
                  PRÓXIMOS TURNOS
                </h3>
                <div className="space-y-4">
                  {turnosEnEspera.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow">
                        #{t.numero}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[var(--text-primary)]">{t.pacienteNombre}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{t.medicoNombre} · Cons. {t.consultorio}</p>
                      </div>
                    </div>
                  ))}
                  {turnosEnEspera.length === 0 && (
                    <p className="text-[var(--text-tertiary)] text-center py-8">No hay turnos en espera</p>
                  )}
                </div>
              </div>

              {/* En Atención */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--success-500)] animate-pulse" />
                  ATENDIENDO AHORA
                </h3>
                <div className="space-y-4">
                  {turnosAtencion.map(t => (
                    <div key={t.id} className="p-6 bg-[var(--success-50)] rounded-2xl border-2 border-[var(--success-200)] text-center">
                      <p className="text-sm text-[var(--text-tertiary)] mb-1">Consultorio {t.consultorio}</p>
                      <p className="text-5xl font-bold text-[var(--success-600)] mb-2">#{t.numero}</p>
                      <p className="text-xl font-semibold text-[var(--text-primary)]">{t.pacienteNombre}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">{t.medicoNombre} · {t.especialidad}</p>
                    </div>
                  ))}
                  {turnosAtencion.length === 0 && (
                    <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border-2 border-dashed border-[var(--border-primary)] text-center">
                      <p className="text-3xl text-[var(--text-tertiary)] mb-2">—</p>
                      <p className="text-lg text-[var(--text-tertiary)]">Esperando próximo paciente</p>
                    </div>
                  )}
                </div>

                {/* Últimos llamados */}
                {turnosLlamados.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">Últimos Llamados</h4>
                    <div className="space-y-2">
                      {turnosLlamados.slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-3 bg-[var(--info-50)] rounded-lg border border-[var(--info-200)]">
                          <span className="text-lg font-bold text-[var(--info-500)]">#{t.numero}</span>
                          <p className="text-sm font-medium text-[var(--text-secondary)]">{t.pacienteNombre}</p>
                          <span className="text-xs text-[var(--text-tertiary)] ml-auto">Cons. {t.consultorio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Pago */}
      <Modal isOpen={showConfirmPago} onClose={() => setShowConfirmPago(false)} title="Confirmar Pago y Generar Ticket" size="md" accent="success">
        {turnoActual && (
          <div className="space-y-6">
            <div className="p-4 bg-[var(--info-50)] rounded-xl border border-[var(--info-200)]">
              <h4 className="font-semibold text-[var(--info-700)] mb-2">📋 Resumen del Turno</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Paciente:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.pacienteNombre}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">C.I.:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.pacienteCI}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Médico:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.medicoNombre}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Consultorio:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.consultorio}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Especialidad:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.especialidad}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Tipo:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.tipo === 'consulta' ? 'Consulta' : turnoActual.tipo === 'examen' ? 'Examen' : 'Vacuna'}</span></div>
                <div className="flex justify-between border-t border-[var(--info-200)] pt-2 mt-2"><span className="font-semibold text-[var(--text-secondary)]">Total a Pagar:</span><span className="font-bold text-xl text-[var(--success-600)]">Bs. {Number(turnoActual.monto).toFixed(2)}</span></div>
              </div>
            </div>

            {/* Vista previa del ticket */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Vista previa del ticket</p>
              <TicketPreview turno={turnoActual} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowConfirmPago(false); setTurnoActual(null); }}>
                Cancelar
              </Button>
              <Button variant="premium" size="lg" onClick={confirmarPago}>
                <DollarSign className="w-4 h-4" />
                  Confirmar Pago Bs. {turnoActual.monto}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal detalle turno */}
      <Modal isOpen={!!modalTurno} onClose={() => setModalTurno(null)} title={`Turno #${modalTurno?.numero}`} size="sm" accent="primary">
        {modalTurno && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <TicketPreview turno={modalTurno} />
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" onClick={() => { window.print(); toast('info', 'Enviando a impresión'); }}>
                <Printer className="w-4 h-4" />Reimprimir Ticket
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 10px; }
        }
      `}</style>
    </div>
  );
}
