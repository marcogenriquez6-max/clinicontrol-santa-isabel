import { useEffect, useState } from 'react';
import { LayoutDashboard, DollarSign, Plus, X } from 'lucide-react';
import { Button, Card, Input, Modal, Badge } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
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
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [showCerrar, setShowCerrar] = useState(false);

  const fetchData = async () => {
    try {
      const [sessionRes, turnosRes] = await Promise.all([
        cajaService.getActual(),
        turnoService.getAll({ limit: 200 }),
      ]);
      const sessionData = sessionRes.data ?? sessionRes;
      const turnosData = turnosRes.data ?? turnosRes;
      setSession(sessionData ?? null);
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
    } catch {
      toast('error', 'Error al cargar datos');
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    } catch (e: any) {
      toast('error', 'Error al abrir sesión', e?.response?.data?.message || 'Intente nuevamente');
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
    } catch (e: any) {
      toast('error', 'Error al cerrar sesión', e?.response?.data?.message || 'Intente nuevamente');
    } finally {
      setLoading(false);
    }
  };

  const turnosPagadosHoy = turnos.filter((t) => t.pagado);
  const totalPagado = turnosPagadosHoy.reduce((sum, t) => sum + Number(t.monto), 0);

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        icon={LayoutDashboard}
        title="Caja"
        subtitle="Gestión de sesiones de caja y cobros"
        stats={[
          { label: 'Estado', value: session?.estado === 'abierta' ? 'Abierta' : 'Cerrada' },
          { label: 'Cobros hoy', value: turnosPagadosHoy.length },
          { label: 'Total Bs.', value: totalPagado.toFixed(2) },
        ]}
      />

      {!session || session.estado === 'cerrada' ? (
        <Card title="Abrir Sesión de Caja" subtitle="Registre el monto inicial para abrir la caja" accent="primary" className="max-w-md animate-in-up animation-delay-100">
          <div className="space-y-4">
            <Input
              label="Monto Inicial (Bs.)"
              type="number"
              placeholder="0.00"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              prefix={<DollarSign className="w-4 h-4" />}
            />
            <Button className="w-full" size="lg" variant="premium" loading={loading} onClick={abrirSesion}>
              <Plus className="w-4 h-4" />
              Abrir Sesión
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in-up animation-delay-100">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Sesión Actual" subtitle={`Abierta desde ${new Date(session.fechaApertura).toLocaleString('es-ES')}`} accent="success" className="animate-in-up animation-delay-200">
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-[var(--success-50)] border border-[var(--success-200)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Monto Inicial</span>
                  <span className="font-bold text-[var(--success-600)]">Bs. {Number(session.montoInicial).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Total Cobrado</span>
                  <span className="font-bold text-[var(--primary-600)]">Bs. {totalPagado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Total Esperado</span>
                  <span className="font-bold text-[var(--text-primary)]">Bs. {(Number(session.montoInicial) + totalPagado).toFixed(2)}</span>
                </div>
                <Button className="w-full" variant="danger" onClick={() => setShowCerrar(true)}>
                  <X className="w-4 h-4" />Cerrar Sesión
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Cobros del Día" subtitle={`${turnosPagadosHoy.length} turno(s) pagado(s)`} accent="accent" className="animate-in-up animation-delay-300">
              {turnosPagadosHoy.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)]">No hay cobros registrados hoy</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Paciente</th>
                        <th>Médico</th>
                        <th>Monto</th>
                        <th>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnosPagadosHoy.map((t) => (
                        <tr key={t.id}>
                          <td className="font-bold">#{t.numero}</td>
                          <td>
                            <p className="font-medium text-[var(--text-primary)]">{t.pacienteNombre}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{t.pacienteCI}</p>
                          </td>
                          <td className="text-sm">{t.medicoNombre}</td>
                          <td><Badge variant="success">Bs. {Number(t.monto).toFixed(2)}</Badge></td>
                          <td className="text-sm text-[var(--text-tertiary)]">
                            {t.creadoEn ? new Date(t.creadoEn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right text-[var(--text-primary)]">Total</td>
                        <td><Badge variant="success">Bs. {totalPagado.toFixed(2)}</Badge></td>
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
          <div className="p-3 rounded-xl bg-[var(--warning-50)] border border-[var(--warning-200)] text-sm text-[var(--warning-700)]">
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
