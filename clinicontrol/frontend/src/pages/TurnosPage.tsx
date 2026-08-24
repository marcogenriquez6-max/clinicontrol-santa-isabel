import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Ticket, Printer, Users, Eye, Play, CheckCircle, XCircle, Monitor, DollarSign, Stethoscope, FlaskConical, Syringe, Check, ChevronLeft, ChevronRight, HeartPulse, Microscope, Waves, Baby, ShieldPlus, Droplets, Siren, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Badge } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import { turnoService, medicoService, pacienteService, tipoAtencionService } from '../api/services';
import type { Turno, Medico, Paciente, TipoAtencion } from '../types';
import { errMsg } from '../api/errMsg';

const iconoServicio = (nombre: string): LucideIcon => {
  const n = nombre.toLowerCase();
  if (n.includes('prenatal')) return HeartPulse;
  if (n.includes('papanicolaou')) return Microscope;
  if (n.includes('colposcopia') || n.includes('biopsia')) return Eye;
  if (n.includes('ecograf')) return Waves;
  if (n.includes('niño sano') || n.includes('nino sano')) return Baby;
  if (n.includes('inyectable')) return Syringe;
  if (n.includes('suero')) return Droplets;
  if (n.includes('emergencia')) return Siren;
  if (n.includes('terapia')) return Activity;
  if (n.includes('examen') || n.includes('laboratorio')) return FlaskConical;
  if (n.includes('vacuna')) return ShieldPlus;
  return Stethoscope;
};

function TicketPreview({ turno, printRef }: { turno: Turno; printRef?: React.RefObject<HTMLDivElement | null> }) {
    const ahora = new Date();
    return (
      <div ref={printRef} id="print-area" className="bg-white text-black p-5 max-w-[300px] mx-auto shadow-sm"
        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '12px' }}>
        {/* Encabezado */}
        <p className="text-center font-bold tracking-[0.15em] text-sm">CLÍNICA SANTA ISABEL</p>
        <p className="text-center text-[10px] mt-1">RIF: J-40123456-7</p>
        <p className="text-center text-[10px]">Av. Principal · Tel. (0281) 000-0000</p>

        <div className="border-t border-dashed border-neutral-400 my-3" />

        {/* Número de turno */}
        <p className="text-center text-[10px] tracking-[0.3em]">TURNO</p>
        <p className="text-center font-bold" style={{ fontSize: '46px', lineHeight: '52px' }}>
          {String(turno.numero).padStart(3, '0')}
        </p>
        <p className="text-center text-[10px]">
          {ahora.toLocaleDateString('es-VE')} · {ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
        </p>

        <div className="border-t border-dashed border-neutral-400 my-3" />

        {/* Datos */}
        <div className="space-y-1">
          <p><span className="opacity-70">PACIENTE:</span> <span className="font-semibold">{turno.pacienteNombre}</span></p>
          <p><span className="opacity-70">C.I.:</span> {turno.pacienteCI}</p>
          <p><span className="opacity-70">MEDICO:</span> {turno.medicoNombre}</p>
          <p><span className="opacity-70">ESPECIALIDAD:</span> {turno.especialidad}</p>
          <p><span className="opacity-70">CONSULTORIO:</span> {turno.consultorio}</p>
        </div>

        <div className="border-t border-dashed border-neutral-400 my-3" />

        <p className="flex justify-between"><span className="opacity-70">FORMA DE PAGO</span><span>EFECTIVO</span></p>
        <p className="flex justify-between font-bold" style={{ fontSize: '14px' }}><span>TOTAL BS.</span>{Number(turno.monto).toFixed(2)}</p>

        {/* Código de barras */}
        <div className="my-3 mx-auto" style={{
          width: '85%', height: '38px',
          background: 'repeating-linear-gradient(90deg,#000 0 2px,transparent 2px 4px,#000 4px 7px,transparent 7px 8px,#000 8px 9px,transparent 9px 13px)',
        }} />
        <p className="text-center text-[10px] tracking-[0.25em]">{String(turno.numero).padStart(6, '0')}</p>

        <div className="border-t border-dashed border-neutral-400 my-3" />
        <p className="text-center text-[10px] leading-relaxed">
          Será llamado por pantalla y audio.<br />Conserve este ticket.
        </p>
        <p className="text-center text-[10px] mt-2 opacity-70">Gracias por su preferencia</p>
      </div>
    );
  };

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<(TipoAtencion & { Icono: LucideIcon })[]>([]);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [paso, setPaso] = useState(1);
  const [, setShowRegistro] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState(0);
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null);
  const [showConfirmPago, setShowConfirmPago] = useState(false);
  const [modalTurno, setModalTurno] = useState<Turno | null>(null);
  const [formData, setFormData] = useState({ nombre: '', ci: '', telefono: '' });
  const [activeSection, setActiveSection] = useState<'caja' | 'sala' | 'pantalla'>('caja');
  const [cajaTab, setCajaTab] = useState<'nuevo' | 'cobros'>('nuevo');
  const printRef = useRef<HTMLDivElement>(null);
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turnosRes, medicosRes, pacientesRes, tiposRes] = await Promise.all([
          turnoService.getAll({ limit: 100 }),
          medicoService.getAll(),
          pacienteService.getAll(),
          tipoAtencionService.getAll(),
        ]);
        setTurnos(Array.isArray(turnosRes) ? turnosRes : (turnosRes as { data?: Turno[] })?.data ?? []);
        setMedicos(Array.isArray(medicosRes) ? medicosRes : (medicosRes as { data?: Medico[] })?.data ?? []);
        setPacientes(Array.isArray(pacientesRes) ? pacientesRes : (pacientesRes as { data?: Paciente[] })?.data ?? []);
        const tiposData = Array.isArray(tiposRes) ? tiposRes : (tiposRes as { data?: TipoAtencion[] })?.data ?? [];
        setServicios(
          tiposData
            .filter(s => s.activo !== false)
            .map(s => ({ ...s, monto: Number(s.monto), Icono: iconoServicio(s.nombre) }))
        );
      } catch {
        // sin datos demo: las secciones muestran sus estados vacíos
      }
    };
    fetchData();
  }, []);

  const validarDatos = (): boolean => {
    if (!formData.nombre.trim() || !formData.ci.trim() || selectedMedico === -1) {
      toast('warning', 'Complete los datos del paciente y seleccione un médico');
      return false;
    }
    return true;
  };

  const generarTurno = async () => {
    const servicio = servicios.find(s => s.id === selectedTipoId);
    if (!servicio || !validarDatos()) return;
    const medico = medicos[selectedMedico];
    const ciBuscado = formData.ci.trim();
    const existente = pacientes.find(p => (p.ci ?? '').trim() === ciBuscado);
    if (!existente) {
      toast('warning', 'Paciente no registrado',
        `${formData.nombre} no está en el Padrón. Regístrelo primero en Pacientes e intente de nuevo.`);
      setPaso(2);
      return;
    }
    try {
      const turnoRes = await turnoService.create({
        pacienteId: existente.id!,
        medicoId: medico.id!,
        monto: servicio.monto,
        tipo: servicio.nombre,
        tipoAtencionId: servicio.id,
        pagado: false,
      });
      const creado = turnoRes.data ?? turnoRes;
      setTurnos(prev => [...prev, creado]);
      setTurnoActual(creado);
      setShowConfirmPago(true);
      toast('success', `Turno #${creado.numero} generado`, `Paciente: ${formData.nombre}`);
    } catch (e: unknown) {
      toast('error', 'Error al generar turno', errMsg(e));
    }
  };

  const confirmarPago = async () => {
    if (!turnoActual) return;
    try {
      await turnoService.marcarPagado(turnoActual.id!);
      setTurnos(prev => prev.map((t) => t.id === turnoActual!.id ? { ...t, pagado: true } : t));
      setShowConfirmPago(false);
      setShowRegistro(false);
      setFormData({ nombre: '', ci: '', telefono: '' });
      setSelectedTipoId(null);
      setPaso(1);
      toast('success', 'Pago registrado', 'Ticket generado - puede imprimirlo');
      setTimeout(() => window.print(), 500);
    } catch {
      toast('error', 'Error al registrar pago');
    }
  };

  const llamarTurno = async (turno: Turno) => {
    try {
      await turnoService.updateEstado(turno.id!, 'llamado');
      setTurnos(prev => prev.map((t) => t.id === turno.id ? { ...t, estado: 'llamado' as const } : t));
      toast('info', `Turno #${turno.numero} llamado`, `Consultorio ${turno.consultorio}`);
    } catch {
      toast('error', 'Error al llamar turno');
    }
  };

  const iniciarAtencion = async (turno: Turno) => {
    try {
      await turnoService.updateEstado(turno.id!, 'atencion');
      setTurnos(prev => prev.map((t) => t.id === turno.id ? { ...t, estado: 'atencion' as const } : t));
      toast('success', `Atendiendo turno #${turno.numero}`);
    } catch {
      toast('error', 'Error al iniciar atención');
    }
  };

  const completarTurno = async (turno: Turno) => {
    try {
      await turnoService.updateEstado(turno.id!, 'completado');
      setTurnos(prev => prev.map((t) => t.id === turno.id ? { ...t, estado: 'completado' as const } : t));
      toast('success', `Turno #${turno.numero} completado`);
    } catch {
      toast('error', 'Error al completar turno');
    }
  };

  const cancelarTurno = async (turno: Turno) => {
    try {
      await turnoService.updateEstado(turno.id!, 'cancelado');
      setTurnos(prev => prev.map((t) => t.id === turno.id ? { ...t, estado: 'cancelado' as const } : t));
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

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader icon={ClipboardList} title="Turnos" subtitle="Gestión de turnos y emisión de tickets" stats={[{ label: 'En espera', value: turnosEnEspera.length }, { label: 'En atención', value: turnosAtencion.length }]} />

      {/* Secciones */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-tertiary)] rounded-xl">
        {([
          { id: 'caja' as const, label: 'Caja y Admisión', icon: DollarSign },
          { id: 'sala' as const, label: 'Sala de Espera', icon: Users },
          { id: 'pantalla' as const, label: 'Pantalla TV', icon: Monitor },
        ]).map(sec => {
          const SecIcon = sec.icon;
          return (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              aria-current={activeSection === sec.id ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeSection === sec.id ? 'bg-[var(--bg-primary)] text-[var(--primary-700)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
              <SecIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECCIÓN CAJA — pestañas internas */}
      {activeSection === 'caja' && (
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="flex justify-center gap-8 border-b border-[var(--border-primary)]">
            {([
              { id: 'nuevo' as const, label: 'Nuevo Turno' },
              { id: 'cobros' as const, label: `Cobros y Cola${turnosPendientesPago.length > 0 ? ` · ${turnosPendientesPago.length}` : ''}` },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setCajaTab(tab.id)}
                className={`pb-2.5 text-sm font-medium text-center border-b-2 -mb-px transition-colors ${cajaTab === tab.id ? 'border-[var(--primary-600)] text-[var(--primary-700)]' : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {cajaTab === 'nuevo' && (() => {
            const servicioSel = servicios.find(s => s.id === selectedTipoId) ?? null;
            const medicoSel = selectedMedico >= 0 ? medicos[selectedMedico] : null;
            const pasos = [
              { n: 1, label: 'Servicio' },
              { n: 2, label: 'Datos del paciente' },
              { n: 3, label: 'Confirmar y cobrar' },
            ];
            return (
              <Card title="Emitir turno nuevo" subtitle="El paciente debe estar registrado previamente en el Padrón de Pacientes">
                {/* Stepper */}
                <div className="flex items-center mb-6">
                  {pasos.map((p, i) => {
                    const completado = paso > p.n;
                    const activo = paso === p.n;
                    return (
                      <div key={p.n} className={`flex items-center ${i < pasos.length - 1 ? 'flex-1' : ''}`}>
                        <button type="button" onClick={() => { if (p.n < paso) setPaso(p.n); }}
                          disabled={p.n > paso}
                          className={`flex items-center gap-2 shrink-0 ${p.n < paso ? 'cursor-pointer' : 'cursor-default'}`}>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                            completado ? 'border-[var(--primary-600)] bg-[var(--primary-600)] text-white'
                            : activo ? 'border-[var(--primary-600)] text-[var(--primary-700)] bg-[var(--primary-50)]'
                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'}`}>
                            {completado ? <Check className="w-4 h-4" /> : p.n}
                          </span>
                          <span className={`text-xs sm:text-sm font-medium hidden sm:block ${activo ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                            {p.label}
                          </span>
                        </button>
                        {i < pasos.length - 1 && (
                          <span className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full ${paso > p.n ? 'bg-[var(--primary-600)]' : 'bg-[var(--border-primary)]'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {paso === 1 && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Seleccione el servicio *</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {servicios.map(sv => {
                        const SIcon = sv.Icono;
                        const activo = selectedTipoId === sv.id;
                        return (
                          <button key={sv.id} type="button" onClick={() => setSelectedTipoId(sv.id)}
                            aria-pressed={activo}
                            className={`flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl border-2 transition-all ${activo
                              ? 'border-[var(--primary-600)] bg-[var(--primary-50)]'
                              : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--neutral-300)]'}`}>
                            <SIcon className="w-5 h-5 shrink-0" style={{ color: activo ? 'var(--primary-600)' : 'var(--text-tertiary)' }} />
                            <span className={`text-xs font-semibold text-center leading-tight line-clamp-2 ${activo ? 'text-[var(--primary-700)]' : 'text-[var(--text-secondary)]'}`}>{sv.nombre}</span>
                            <span className="text-xs tabular-nums text-[var(--text-tertiary)]">Bs. {sv.monto}</span>
                          </button>
                        );
                      })}
                      {servicios.length === 0 && (
                        <p className="col-span-full py-8 text-center text-sm text-[var(--text-tertiary)]">
                          No hay servicios disponibles. Verifique la conexión con el servidor.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {paso === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <div className="sm:col-span-2">
                      <Input label="Nombre del paciente *" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))} />
                    </div>
                    <Input label="Cédula *" placeholder="1234567" value={formData.ci} onChange={e => setFormData(f => ({ ...f, ci: e.target.value }))} />
                    <Input label="Teléfono" placeholder="77712345" value={formData.telefono} onChange={e => setFormData(f => ({ ...f, telefono: e.target.value }))} />
                    <div className="sm:col-span-2">
                      <Select label="Médico asignado *" value={selectedMedico} onChange={e => setSelectedMedico(Number(e.target.value))}
                        options={[
                          { value: -1, label: 'Seleccionar médico...' },
                          ...medicos.map((m, i) => ({ value: i, label: `${m.nombre} ${m.apellido}${m.especialidad?.nombre ? ` · ${m.especialidad.nombre}` : ''}` })),
                        ]}
                      />
                    </div>
                  </div>
                )}

                {paso === 3 && servicioSel && (
                  <div>
                    <ul className="divide-y divide-[var(--border-secondary)] rounded-lg border border-[var(--border-primary)] overflow-hidden">
                      <li className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)]">
                        {(() => { const SIcon = servicioSel.Icono; return <SIcon className="w-5 h-5 text-[var(--primary-600)] shrink-0" />; })()}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--text-primary)] truncate">{servicioSel.nombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Servicio solicitado</p>
                        </div>
                        <span className="font-bold tabular-nums text-[var(--primary-700)]">Bs. {servicioSel.monto.toFixed(2)}</span>
                      </li>
                      <li className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)] truncate">{formData.nombre}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">CI {formData.ci}{formData.telefono ? ` · Tel. ${formData.telefono}` : ''}</p>
                      </li>
                      <li className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {medicoSel ? `${medicoSel.nombre} ${medicoSel.apellido}` : '—'}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">{medicoSel?.especialidad?.nombre ?? 'Médico asignado'}</p>
                      </li>
                    </ul>
                    <div className="flex items-center justify-between mt-4 px-4 py-3 rounded-lg border border-[var(--primary-200)] bg-[var(--primary-50)]">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Total a cobrar</span>
                      <span className="text-xl font-bold tabular-nums text-[var(--primary-800)]">Bs. {servicioSel.monto.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[var(--border-primary)]">
                  {paso > 1 ? (
                    <Button variant="secondary" onClick={() => setPaso(paso - 1)}>
                      <ChevronLeft className="w-4 h-4" />Atrás
                    </Button>
                  ) : <span />}
                  {paso < 3 && (
                    <Button
                      disabled={paso === 1 && !selectedTipoId}
                      onClick={() => { if (paso === 2 && !validarDatos()) return; setPaso(paso + 1); }}
                    >
                      Continuar<ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {paso === 3 && (
                    <Button onClick={generarTurno}>
                      <Ticket className="w-4 h-4" />Generar y cobrar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })()}

          {cajaTab === 'cobros' && (
            <div className="space-y-5">
              <Card title={`Pendientes de cobro (${turnosPendientesPago.length})`} accent="warning">
                {turnosPendientesPago.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Sin pendientes de cobro</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-secondary)]">
                    {turnosPendientesPago.map(t => (
                      <li key={t.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold tabular-nums shrink-0" style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}>
                          {String(t.numero).padStart(3, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">{t.medicoNombre}</p>
                        </div>
                        <span className="font-semibold tabular-nums text-sm shrink-0">Bs. {Number(t.monto).toFixed(2)}</span>
                        <Button size="sm" variant="outline" onClick={() => { setTurnoActual(t); setShowConfirmPago(true); }} className="shrink-0">
                          Cobrar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Últimos turnos" accent="primary">
                {[...turnos].length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Aún no hay turnos hoy</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-secondary)]">
                    {[...turnos].reverse().slice(0, 4).map(t => (
                      <li key={t.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold text-white tabular-nums shrink-0" style={{ backgroundColor: 'var(--primary-700)' }}>
                          {String(t.numero).padStart(3, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">{t.medicoNombre}</p>
                        </div>
                        {estadoBadge(t.estado)}
                        <Badge variant={t.pagado ? 'success' : 'danger'}>{t.pagado ? 'Pagado' : 'Pendiente'}</Badge>
                        <Button variant="ghost" size="sm" icon onClick={() => setModalTurno(t)} aria-label="Ver ticket">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN SALA DE ESPERA — flujo kanban */}
      {activeSection === 'sala' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {([
            { titulo: 'En Espera', lista: turnosEnEspera, color: 'var(--warning-500)', accion: llamarTurno, label: 'Llamar', Icono: Play },
            { titulo: 'Llamados', lista: turnosLlamados, color: 'var(--primary-600)', accion: iniciarAtencion, label: 'Iniciar', Icono: CheckCircle },
          ] as const).map(col => (
            <Card key={col.titulo} title={col.titulo} subtitle={`${col.lista.length} paciente(s)`}>
              {col.lista.length === 0 ? (
                <p className="text-center py-10 text-sm text-[var(--text-tertiary)]">Sin pacientes</p>
              ) : (
                <div className="space-y-2">
                  {col.lista.map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold text-white tabular-nums shrink-0" style={{ backgroundColor: col.color }}>
                          {String(t.numero).padStart(3, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">{t.medicoNombre} · Cons. {t.consultorio}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => col.accion(t)} className="shrink-0">
                        <col.Icono className="w-4 h-4" />{col.label}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <Card title="En Atención" subtitle={`${turnosAtencion.length} consulta(s) en curso`}>
            {turnosAtencion.length === 0 ? (
              <p className="text-center py-10 text-sm text-[var(--text-tertiary)]">Sin consultas activas</p>
            ) : (
              <div className="space-y-2">
                {turnosAtencion.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[var(--success-200)] bg-[var(--success-50)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold text-white tabular-nums shrink-0" style={{ backgroundColor: 'var(--success-600)' }}>
                        {String(t.numero).padStart(3, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{t.medicoNombre}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="success" icon onClick={() => completarTurno(t)} aria-label="Completar">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" icon onClick={() => cancelarTurno(t)} aria-label="Cancelar">
                        <XCircle className="w-4 h-4 text-[var(--danger-500)]" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SECCIÓN PANTALLA TV — vista kiosk */}
      {activeSection === 'pantalla' && (
        <div className="rounded-xl overflow-hidden border border-[var(--border-primary)] bg-white">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 lg:px-10 py-6" style={{ backgroundColor: 'var(--primary-900)' }}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--primary-200)]">Clínica Santa Isabel</p>
              <p className="text-white text-2xl font-bold mt-1">Turnos en tiempo real</p>
            </div>
            <div className="sm:text-right">
              <p className="text-white font-bold tabular-nums text-5xl leading-none">
                {horaActual.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[var(--primary-300)] text-sm capitalize mt-1">
                {horaActual.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </header>

          <section className="px-6 lg:px-10 py-7">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--success-500)' }} />
              Atendiendo ahora
            </h3>
            {turnosAtencion.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-primary)] px-6 py-10 text-center">
                <p className="text-[var(--text-tertiary)]">Esperando el próximo paciente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {turnosAtencion.map(t => (
                  <div key={t.id} className="flex items-center gap-5 rounded-lg border border-[var(--success-200)] bg-[var(--success-50)] px-6 py-5">
                    <span className="text-5xl font-bold tabular-nums text-[var(--success-700)] w-24 shrink-0">{String(t.numero).padStart(3, '0')}</span>
                    <div className="min-w-0">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-white border border-[var(--success-300)] text-[var(--success-700)] mb-1.5">Consultorio {t.consultorio}</span>
                      <p className="text-xl font-semibold text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{t.medicoNombre} · {t.especialidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[var(--border-primary)]">
            <section className="px-6 lg:px-10 py-6 border-b md:border-b-0 md:border-r border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--warning-500)' }} />
                Próximos turnos
              </h3>
              {turnosEnEspera.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] py-6">No hay turnos en espera</p>
              ) : (
                <ul className="space-y-2.5">
                  {turnosEnEspera.slice(0, 6).map(t => (
                    <li key={t.id} className="flex items-center gap-4">
                      <span className="w-12 h-12 rounded-md flex items-center justify-center font-bold text-white tabular-nums shrink-0" style={{ backgroundColor: 'var(--primary-700)' }}>
                        {String(t.numero).padStart(3, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">{t.pacienteNombre}</p>
                        <p className="text-sm text-[var(--text-tertiary)] truncate">{t.medicoNombre} · Cons. {t.consultorio}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="px-6 lg:px-10 py-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--info-500)' }} />
                Últimos llamados
              </h3>
              {turnosLlamados.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] py-6">Sin llamados recientes</p>
              ) : (
                <ul className="space-y-2.5">
                  {turnosLlamados.slice(0, 6).map(t => (
                    <li key={t.id} className="flex items-center gap-3 rounded-md border border-[var(--info-200)] bg-[var(--info-50)] px-4 py-2.5">
                      <span className="font-bold tabular-nums text-[var(--info-700)]">{String(t.numero).padStart(3, '0')}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">{t.pacienteNombre}</span>
                      <span className="ml-auto text-xs text-[var(--text-tertiary)] shrink-0">Cons. {t.consultorio}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Pago */}
      <Modal isOpen={showConfirmPago} onClose={() => setShowConfirmPago(false)} title="Confirmar Pago y Generar Ticket" size="md" accent="success">
        {turnoActual && (
          <div className="space-y-6">
            <div className="p-4 bg-[var(--info-50)] rounded-xl border border-[var(--info-200)]">
              <h4 className="font-semibold text-[var(--info-700)] mb-2">Resumen del Turno</h4>
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
              <TicketPreview turno={turnoActual} printRef={printRef} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowConfirmPago(false); setTurnoActual(null); }}>
                Cancelar
              </Button>
              <Button variant="primary" size="lg" onClick={confirmarPago}>
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
              <TicketPreview turno={modalTurno} printRef={printRef} />
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
