import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Ticket, Printer, Users, Eye, Play, CheckCircle, XCircle, Monitor, DollarSign, Stethoscope, FlaskConical, Syringe, HeartPulse, Microscope, Waves, Baby, ShieldPlus, Droplets, Siren, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, Modal, Input } from '../components/ui';
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
          {turno.fechaProgramada
            ? turno.fechaProgramada.slice(0, 10).split('-').reverse().join('/') + ' · ' + (turno.horaProgramada ?? '')
            : ahora.toLocaleDateString('es-VE') + ' · ' + ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
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
  const [, setShowRegistro] = useState(false);
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null);
  const [showConfirmPago, setShowConfirmPago] = useState(false);
  const [modalTurno, setModalTurno] = useState<Turno | null>(null);
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacienteSel, setPacienteSel] = useState<Paciente | null>(null);
  const [medicoIdSel, setMedicoIdSel] = useState<number | null>(null);
  const hoyStr = new Date().toISOString().slice(0, 10);
  const [fechaSel, setFechaSel] = useState(hoyStr);
  const [horaSel, setHoraSel] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'caja' | 'sala' | 'pantalla'>('caja');
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

  /* ── Agenda: slots de 30 min (mañana y tarde) ── */
  const SLOTS_MANANA = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const SLOTS_TARDE = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  const pacientesEncontrados = (() => {
    const q = pacienteQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return pacientes.filter((p) =>
      (p.ci ?? '').toLowerCase().includes(q) ||
      (p.nombre + ' ' + p.apellido).toLowerCase().includes(q) ||
      (p.telefono ?? '').includes(q),
    ).slice(0, 6);
  })();

  const calcularEdad = (fechaNac?: string): number | null => {
    if (!fechaNac) return null;
    const fn = new Date(fechaNac);
    if (isNaN(fn.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fn.getFullYear();
    const m = hoy.getMonth() - fn.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
    return edad;
  };

  const esSlotOcupado = (hora: string): boolean =>
    turnos.some((t) =>
      t.medicoId === medicoIdSel &&
      t.horaProgramada === hora &&
      t.fechaProgramada?.slice(0, 10) === fechaSel &&
      t.estado !== 'cancelado',
    );

  const esSlotPasado = (hora: string): boolean => {
    if (fechaSel !== hoyStr) return false;
    const partes = hora.split(':');
    const h = Number(partes[0]);
    const m = Number(partes[1]);
    const ahora = new Date();
    return h * 60 + m <= ahora.getHours() * 60 + ahora.getMinutes();
  };

  const fechaSelLabel = (() => {
    const d = new Date(fechaSel + 'T12:00:00');
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
  })();

  const moverFecha = (dias: number) => {
    const d = new Date(fechaSel + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    const nuevo = d.toISOString().slice(0, 10);
    if (nuevo >= hoyStr) { setFechaSel(nuevo); setHoraSel(null); }
  };

  const servicioSelData = servicios.find(s2 => s2.id === selectedTipoId) ?? null;
  const medicoSelData = medicos.find(m2 => m2.id === medicoIdSel) ?? null;

  const generarTurno = async () => {
    const servicio = servicios.find(s3 => s3.id === selectedTipoId);
    if (!pacienteSel || !servicio || !medicoIdSel || !horaSel) {
      toast('warning', 'Complete el flujo: paciente, servicio, médico y horario');
      return;
    }
    try {
      const turnoRes = await turnoService.create({
        pacienteId: pacienteSel.id!,
        medicoId: medicoIdSel,
        monto: servicio.monto,
        tipo: servicio.nombre,
        tipoAtencionId: servicio.id,
        pagado: false,
        fechaProgramada: fechaSel,
        horaProgramada: horaSel,
      });
      const creado = turnoRes.data ?? turnoRes;
      setTurnos(prev => [...prev, creado]);
      setTurnoActual(creado);
      setShowConfirmPago(true);
      toast('success', 'Turno #' + creado.numero + ' generado', 'Paciente: ' + pacienteSel.nombre + ' ' + pacienteSel.apellido);
    } catch (e: unknown) {
      toast('error', 'Error al generar turno', errMsg(e));
    }
  };

  const resetFlujo = () => {
    setPacienteQuery('');
    setPacienteSel(null);
    setSelectedTipoId(null);
    setMedicoIdSel(null);
    setHoraSel(null);
    setFechaSel(hoyStr);
  };

  const confirmarPago = async () => {
    if (!turnoActual) return;
    try {
      await turnoService.marcarPagado(turnoActual.id!);
      setTurnos(prev => prev.map((t) => t.id === turnoActual!.id ? { ...t, pagado: true } : t));
      setShowConfirmPago(false);
      setShowRegistro(false);
      resetFlujo();
      toast('success', 'Pago registrado', 'Ticket generado - puede imprimirlo');
      setTimeout(() => window.print(), 500);
    } catch {
      toast('error', 'Error al registrar pago');
    }
  };

  const enviarWhatsApp = (t: Turno) => {
    const tel = (t.pacienteTel ?? '').replace(/[^0-9]/g, '');
    const num = String(t.numero).padStart(3, '0');
    const msg = encodeURIComponent(
      'Clínica Santa Isabel: Turno ' + num + ' - ' + t.pacienteNombre +
      '. ' + (t.tipo ?? '') + ' con ' + t.medicoNombre +
      '. ' + (t.fechaProgramada ?? '') + ' ' + (t.horaProgramada ?? '') +
      '. Consultorio ' + (t.consultorio || '1') +
      '. Bs. ' + Number(t.monto).toFixed(2),
    );
    window.open(tel ? 'https://wa.me/' + tel + '?text=' + msg : 'https://wa.me/?text=' + msg, '_blank');
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
        <div className="max-w-4xl mx-auto w-full">
          {(() => {
            return (
              <Card title="Emitir turno nuevo" subtitle="Flujo: paciente → servicio → médico y horario">
                {/* ══ 1. BUSCAR PACIENTE ══ */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary-600)] text-white text-xs mr-1.5">1</span>
                    Buscar paciente
                  </p>
                  {pacienteSel ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--primary-600)] bg-[var(--primary-50)]">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: 'var(--primary-600)' }}>
                        {(pacienteSel.nombre[0] ?? '') + (pacienteSel.apellido?.[0] ?? '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-primary)] truncate">{pacienteSel.nombre} {pacienteSel.apellido}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          CI: {pacienteSel.ci ?? '—'}
                          {pacienteSel.telefono ? ' · Tel. ' + pacienteSel.telefono : ''}
                          {calcularEdad(pacienteSel.fechaNacimiento) !== null ? ' · ' + calcularEdad(pacienteSel.fechaNacimiento) + ' años' : ''}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setPacienteSel(null); setPacienteQuery(''); }}>Cambiar</Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Buscar por CI, nombre o teléfono..."
                        value={pacienteQuery}
                        onChange={(e) => setPacienteQuery(e.target.value)}
                      />
                      {pacienteQuery.trim().length >= 2 && (
                        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-lg overflow-hidden animate-scale origin-top">
                          {pacientesEncontrados.length > 0 ? pacientesEncontrados.map((p) => (
                            <button key={p.id} type="button"
                              onClick={() => { setPacienteSel(p); setPacienteQuery(''); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-secondary)] last:border-b-0">
                              <p className="text-sm font-medium text-[var(--text-primary)]">{p.nombre} {p.apellido}</p>
                              <p className="text-xs text-[var(--text-secondary)]">CI: {p.ci ?? '—'}{p.telefono ? ' · ' + p.telefono : ''}</p>
                            </button>
                          )) : (
                            <button type="button" onClick={() => window.open('/pacientes', '_self')}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-[var(--primary-700)] hover:bg-[var(--primary-50)] transition-colors flex items-center gap-2">
                              + Registrar nuevo paciente (no encontrado)
                            </button>
                          )}
                          {pacientesEncontrados.length > 0 && (
                            <button type="button" onClick={() => window.open('/pacientes', '_self')}
                              className="w-full text-left px-4 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors border-t border-[var(--border-secondary)]">
                              + Registrar nuevo paciente
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ══ 2. SERVICIO ══ */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary-600)] text-white text-xs mr-1.5">2</span>
                    Servicio
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {servicios.map((sv) => {
                      const SIcon = sv.Icono;
                      const activo = selectedTipoId === sv.id;
                      return (
                        <button key={sv.id} type="button" onClick={() => setSelectedTipoId(sv.id)}
                          aria-pressed={activo}
                          className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all ${activo
                            ? 'border-[var(--primary-600)] bg-[var(--primary-50)]'
                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--neutral-300)]'}`}>
                          <SIcon className="w-4 h-4 shrink-0" style={{ color: activo ? 'var(--primary-600)' : 'var(--text-tertiary)' }} />
                          <span className={`text-xs font-semibold text-center leading-tight line-clamp-2 ${activo ? 'text-[var(--primary-700)]' : 'text-[var(--text-secondary)]'}`}>{sv.nombre}</span>
                          <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">Bs. {sv.monto} · {sv.duracionMinutos ?? 30} min</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ══ 3. MÉDICO Y HORARIO ══ */}
                <div className="mb-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary-600)] text-white text-xs mr-1.5">3</span>
                    Médico
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 max-h-44 overflow-y-auto pr-1">
                    {medicos.map((m) => {
                      const activo = medicoIdSel === m.id;
                      const ocupado = turnos.some((t) => t.medicoId === m.id && t.estado === 'atencion');
                      return (
                        <button key={m.id} type="button" onClick={() => { setMedicoIdSel(m.id!); setHoraSel(null); }}
                          aria-pressed={activo}
                          className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${activo
                            ? 'border-[var(--primary-600)] bg-[var(--primary-50)]'
                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--neutral-300)]'}`}>
                          <p className={`text-sm font-semibold truncate ${activo ? 'text-[var(--primary-700)]' : 'text-[var(--text-primary)]'}`}>Dr. {m.nombre} {m.apellido}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{m.especialidad?.nombre ?? 'Medicina General'}</p>
                          <p className="text-xs mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ocupado ? 'var(--danger-500)' : 'var(--success-500)' }} />
                            <span style={{ color: ocupado ? 'var(--danger-600)' : 'var(--success-600)' }}>{ocupado ? 'Ocupado' : 'Disponible'}</span>
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Fecha de atención</p>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <Button size="sm" variant="secondary" onClick={() => moverFecha(-1)} disabled={fechaSel <= hoyStr}>
                      ←
                    </Button>
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{fechaSelLabel}{fechaSel === hoyStr ? ' (hoy)' : ''}</span>
                    <Button size="sm" variant="secondary" onClick={() => moverFecha(1)}>
                      →
                    </Button>
                  </div>

                  {medicoIdSel && (() => {
                    const renderSlots = (titulo: string, slots: string[]) => (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">{titulo}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                          {slots.map((hora) => {
                            const ocupado = esSlotOcupado(hora);
                            const pasado = esSlotPasado(hora);
                            const activo = horaSel === hora;
                            const disabled = ocupado || pasado;
                            return (
                              <button key={hora} type="button" disabled={disabled}
                                onClick={() => setHoraSel(hora)}
                                title={ocupado ? 'Ocupado' : pasado ? 'Ya pasó' : 'Disponible'}
                                className={`py-1.5 rounded-md text-xs font-medium tabular-nums border transition-all ${
                                  activo ? 'bg-[var(--primary-600)] border-[var(--primary-600)] text-white'
                                  : disabled ? 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-tertiary)] line-through cursor-not-allowed'
                                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--primary-400)] hover:text-[var(--primary-700)]'}`}>
                                {hora}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                    return (
                      <div className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                        {renderSlots('Mañana', SLOTS_MANANA)}
                        {renderSlots('Tarde', SLOTS_TARDE)}
                      </div>
                    );
                  })()}
                </div>

                {/* ══ RESUMEN + EMITIR ══ */}
                <div className="mt-5 pt-4 border-t border-[var(--border-primary)]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
                    <div><p className="text-xs text-[var(--text-tertiary)]">Paciente</p><p className="font-medium text-[var(--text-primary)] truncate">{pacienteSel ? pacienteSel.nombre + ' ' + pacienteSel.apellido : '—'}</p></div>
                    <div><p className="text-xs text-[var(--text-tertiary)]">Servicio</p><p className="font-medium text-[var(--text-primary)] truncate">{servicioSelData ? servicioSelData.nombre : '—'}</p></div>
                    <div><p className="text-xs text-[var(--text-tertiary)]">Médico</p><p className="font-medium text-[var(--text-primary)] truncate">{medicoSelData ? 'Dr. ' + medicoSelData.nombre + ' ' + medicoSelData.apellido : '—'}</p></div>
                    <div><p className="text-xs text-[var(--text-tertiary)]">Fecha</p><p className="font-medium text-[var(--text-primary)]">{fechaSelLabel}</p></div>
                    <div><p className="text-xs text-[var(--text-tertiary)]">Hora</p><p className="font-medium text-[var(--text-primary)] tabular-nums">{horaSel ?? '—'}</p></div>
                    <div><p className="text-xs text-[var(--text-tertiary)]">Duración</p><p className="font-medium text-[var(--text-primary)]">{servicioSelData ? servicioSelData.duracionMinutos ?? 30 : '—'} min</p></div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-dashed border-[var(--border-primary)]">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Total a cobrar{' '}
                      <span className="ml-1 text-lg font-bold tabular-nums text-[var(--primary-800)]">
                        Bs. {servicioSelData ? servicioSelData.monto.toFixed(2) : '0.00'}
                      </span>
                    </span>
                    <Button onClick={generarTurno} disabled={!pacienteSel || !selectedTipoId || !medicoIdSel || !horaSel} className="w-full sm:w-auto">
                      <Ticket className="w-4 h-4" />Emitir turno
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()}
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
        <div className="rounded-xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-card)]">
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
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-card)] border border-[var(--success-300)] text-[var(--success-700)] mb-1.5">Consultorio {t.consultorio}</span>
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
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Servicio:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.tipo}</span></div>
                {turnoActual.fechaProgramada && (
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Fecha:</span><span className="font-medium text-[var(--text-primary)]">{turnoActual.fechaProgramada.slice(0, 10)} · {turnoActual.horaProgramada}</span></div>
                )}
                <div className="flex justify-between border-t border-[var(--info-200)] pt-2 mt-2"><span className="font-semibold text-[var(--text-secondary)]">Total a Pagar:</span><span className="font-bold text-xl text-[var(--success-600)]">Bs. {Number(turnoActual.monto).toFixed(2)}</span></div>
              </div>
            </div>

            {/* Vista previa del ticket */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Vista previa del ticket</p>
              <TicketPreview turno={turnoActual} printRef={printRef} />
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => enviarWhatsApp(turnoActual)}>
                Enviar por WhatsApp
              </Button>
              <Button variant="secondary" onClick={() => { setShowConfirmPago(false); setTurnoActual(null); resetFlujo(); }}>
                Nuevo turno
              </Button>
              <Button variant="primary" size="lg" onClick={confirmarPago}>
                <DollarSign className="w-4 h-4" />
                  Confirmar Pago Bs. {Number(turnoActual.monto).toFixed(2)}
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
