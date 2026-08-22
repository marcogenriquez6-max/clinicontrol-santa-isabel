import { useEffect, useState } from 'react';
import { LayoutDashboard, DollarSign, Plus, X, LockKeyhole, RefreshCw } from 'lucide-react';
import { Button, Card, Input, Modal } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import { errMsg } from '../api/errMsg';
import { cajaService } from '../api/caja.service';
import { turnoService } from '../api/turno.service';
import { useAuthStore } from '../store/authStore';
import type { CajaSession } from '../types';
import type { Turno } from '../types/turno.types';

export default function CajaPage() {
  const user = useAuthStore((s) => s.user);
  const [session, setSession] = useState<CajaSession | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [showCerrar, setShowCerrar] = useState(false);

  const mensajeCarga = (e: unknown): string => {
    const err = e as { response?: { status?: number }; request?: unknown };
    const status = err?.response?.status;
    if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (status === 429) return 'El servidor está saturado de solicitudes. Espera unos segundos y reintenta.';
    if (!err?.response) return 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
    return errMsg(e, 'Error inesperado del servidor.');
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [sessionRes, turnosRes] = await Promise.all([
        cajaService.getActual(),
        turnoService.getAll({ limit: 200 }),
      ]);
      const sessionData = (sessionRes as { data?: CajaSession })?.data ?? sessionRes;
      const turnosData = (turnosRes as { data?: Turno[] })?.data ?? turnosRes;
      setSession((sessionData as CajaSession | null) ?? null);
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
    } catch (e: unknown) {
      setLoadError(mensajeCarga(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    const init = async () => {
      setLoadError(null);
      try {
        const [sessionRes, turnosRes] = await Promise.all([
          cajaService.getActual(),
          turnoService.getAll({ limit: 200 }),
        ]);
        if (cancelado) return;
        const sessionData = (sessionRes as { data?: CajaSession })?.data ?? sessionRes;
        const turnosData = (turnosRes as { data?: Turno[] })?.data ?? turnosRes;
        setSession((sessionData as CajaSession | null) ?? null);
        setTurnos(Array.isArray(turnosData) ? turnosData : []);
      } catch (e: unknown) {
        if (!cancelado) setLoadError(mensajeCarga(e));
      }
    };
    init();
    return () => { cancelado = true; };
  }, []);

  const abrirSesion = async () => {
    if (!montoInicial || Number(montoInicial) <= 0) {
      toast('warning', 'Ingrese un monto inicial válido');
      return;
    }
    if (!user?.id) {
      toast('error', 'Debe iniciar sesión');
      return;
    }
    setLoading(true);
    try {
      const res = await cajaService.abrirSesion(Number(montoInicial), user.id);
      const nueva = res.data ?? res;
      setSession(nueva);
      setMontoInicial('');
      toast('success', 'Sesión de caja abierta', `Monto inicial: Bs. ${Number(montoInicial).toFixed(2)}`);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Intente nuevamente';
      toast('error', 'Error al abrir sesión', message);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = async () => {
    if (!session || !montoFinal || Number(montoFinal) < 0) {
      toast('warning', 'Ingrese un monto final válido');
      return;
    }
    setLoading(true);
    try {
      const res = await cajaService.cerrarSesion(session.id, Number(montoFinal), obsCierre || undefined);
      const cerrada = res.data ?? res;
      setSession(cerrada);
      setShowCerrar(false);
      toast('success', 'Sesión de caja cerrada', `Monto final: Bs. ${Number(montoFinal).toFixed(2)}`);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Intente nuevamente';
      toast('error', 'Error al cerrar sesión', message);
    } finally {
      setLoading(false);
    }
  };

  const turnosPagadosHoy = turnos.filter((t) => t.pagado);
  const totalPagado = turnosPagadosHoy.reduce((sum, t) => sum + Number(t.monto), 0);
  const cajaAbierta = !!session && session.estado === 'abierta';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Caja"
        subtitle="Apertura de sesión, cobros del día y arqueo"
        stats={[
          { label: 'Estado', value: cajaAbierta ? 'Abierta' : 'Cerrada' },
          { label: 'Cobros hoy', value: turnosPagadosHoy.length },
          { label: 'Total Bs.', value: totalPagado.toFixed(2) },
        ]}
      />

      {loadError && (
        <div className="max-w-4xl mx-auto rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border"
          style={{ backgroundColor: 'var(--danger-50)', borderColor: 'var(--danger-200)' }}>
          <p className="flex-1 text-sm" style={{ color: 'var(--danger-700)' }}>
            {loadError}
          </p>
          <Button size="sm" variant="secondary" onClick={fetchData} loading={loading}>
            <RefreshCw className="w-4 h-4" />Reintentar conexión
          </Button>
        </div>
      )}

      {/* CAJA CERRADA — pantalla de apertura centrada */}
      {!cajaAbierta && !loadError && (
        <div className="max-w-md mx-auto pt-8">
          <Card className="text-center" padding>
            <div className="py-6 px-2 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                <LockKeyhole className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                  Caja cerrada
                </span>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">No hay una sesión activa</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Para comenzar las operaciones del día, ingrese el fondo inicial con el que abre caja.
                </p>
              </div>
              <div className="max-w-[240px] mx-auto text-left">
                <Input
                  label="Fondo inicial (Bs.)"
                  type="number"
                  placeholder="0.00"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  prefix={<DollarSign className="w-4 h-4" />}
                />
              </div>
              <Button size="lg" loading={loading} onClick={abrirSesion} className="w-full max-w-[240px] mx-auto">
                <Plus className="w-4 h-4" />Abrir Sesión
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CAJA ABIERTA */}
      {cajaAbierta && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card title="Sesión Actual" subtitle={`Abierta desde ${new Date(session!.fechaApertura).toLocaleString('es-VE')}`} accent="success">
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-[var(--success-50)] border border-[var(--success-200)]">
                <span className="text-sm text-[var(--text-tertiary)]">Monto Inicial</span>
                <span className="font-bold tabular-nums text-[var(--success-600)]">Bs. {Number(session!.montoInicial).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <span className="text-sm text-[var(--text-tertiary)]">Total Cobrado</span>
                <span className="font-bold tabular-nums text-[var(--primary-600)]">Bs. {totalPagado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <span className="text-sm text-[var(--text-tertiary)]">Total Esperado</span>
                <span className="font-bold tabular-nums text-[var(--text-primary)]">Bs. {(Number(session!.montoInicial) + totalPagado).toFixed(2)}</span>
              </div>
              <Button className="w-full" variant="danger" onClick={() => setShowCerrar(true)}>
                <X className="w-4 h-4" />Cerrar Sesión
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card title="Cobros del Día" subtitle={`${turnosPagadosHoy.length} turno(s) pagado(s)`}>
              {turnosPagadosHoy.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-tertiary)]">No hay cobros registrados hoy</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium w-full">
                    <thead>
                      <tr><th>#</th><th>Paciente</th><th>Médico</th><th>Monto</th><th>Hora</th></tr>
                    </thead>
                    <tbody>
                      {turnosPagadosHoy.map((t) => (
                        <tr key={t.id}>
                          <td className="font-bold tabular-nums">{String(t.numero).padStart(3, '0')}</td>
                          <td>{t.pacienteNombre}</td>
                          <td className="text-sm">{t.medicoNombre}</td>
                          <td className="tabular-nums font-medium">Bs. {Number(t.monto).toFixed(2)}</td>
                          <td className="text-sm text-[var(--text-tertiary)] tabular-nums">
                            {t.creadoEn ? new Date(t.creadoEn).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right text-[var(--text-primary)]">Total</td>
                        <td className="tabular-nums">Bs. {totalPagado.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <Modal isOpen={showCerrar} onClose={() => setShowCerrar(false)} title="Cerrar Sesión de Caja" size="sm" accent="danger">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--warning-50)] border border-[var(--warning-200)] text-sm text-[var(--warning-700)]">
            Está a punto de cerrar la sesión de caja. Verifique los montos antes de confirmar.
          </div>
          <Input
            label="Monto Final (Bs.) *"
            type="number"
            placeholder="0.00"
            value={montoFinal}
            onChange={(e) => setMontoFinal(e.target.value)}
            prefix={<DollarSign className="w-4 h-4" />}
          />
          <Input
            label="Observaciones"
            placeholder="Notas opcionales..."
            value={obsCierre}
            onChange={(e) => setObsCierre(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCerrar(false)}>Cancelar</Button>
            <Button variant="danger" loading={loading} onClick={cerrarSesion}>
              <X className="w-4 h-4" />Cerrar Sesión
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
