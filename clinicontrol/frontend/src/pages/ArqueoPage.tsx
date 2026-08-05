import { useEffect, useState } from 'react';
import { LayoutDashboard, ClipboardCheck, Plus } from 'lucide-react';
import { Button, Card, Input, Textarea, Badge } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import { arqueoCajaService } from '../api/arqueoCaja.service';
import { useAuthStore } from '../store/authStore';
import type { Arqueo } from '../types';

export default function ArqueoPage() {
  const user = useAuthStore((s) => s.user);
  const [arqueos, setArqueos] = useState<Arqueo[]>([]);
  const [loading, setLoading] = useState(false);
  const [montoEsperado, setMontoEsperado] = useState('');
  const [montoReal, setMontoReal] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const fetchArqueos = async () => {
    try {
      const res = await arqueoCajaService.getAll();
      const data = res.data ?? res;
      setArqueos(Array.isArray(data) ? data : []);
    } catch {
      toast('error', 'Error al cargar arqueos');
    }
  };

  useEffect(() => { fetchArqueos(); }, []);

  const crearArqueo = async () => {
    if (!montoEsperado || !montoReal || Number(montoEsperado) < 0 || Number(montoReal) < 0) {
      toast('warning', 'Ingrese montos válidos');
      return;
    }
    setLoading(true);
    try {
      const res = await arqueoCajaService.crear({
        montoEsperado: Number(montoEsperado),
        montoReal: Number(montoReal),
        observaciones: observaciones || undefined,
        usuarioId: user?.id,
      });
      const nuevo = res.data ?? res;
      setArqueos((prev) => [nuevo, ...prev]);
      setMontoEsperado('');
      setMontoReal('');
      setObservaciones('');
      const diff = Number(montoReal) - Number(montoEsperado);
      toast(
        diff === 0 ? 'success' : 'warning',
        'Arqueo registrado',
        `Diferencia: Bs. ${diff.toFixed(2)}`
      );
    } catch (e: any) {
      toast('error', 'Error al registrar arqueo', e?.response?.data?.message || 'Intente nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        icon={LayoutDashboard}
        title="Arqueo de Caja"
        subtitle="Conciliación de caja y control de diferencias"
        stats={[
          { label: 'Registros', value: arqueos.length },
          { label: 'Último', value: arqueos.length > 0 ? new Date(arqueos[0].fecha).toLocaleDateString('es-ES') : '-' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title="Registrar Arqueo" subtitle="Ingrese los montos para conciliar" accent="primary" className="animate-in-up animation-delay-100">
            <div className="space-y-4">
              <Input
                label="Monto Esperado (Bs.) *"
                type="number"
                placeholder="0.00"
                value={montoEsperado}
                onChange={(e) => setMontoEsperado(e.target.value)}
              />
              <Input
                label="Monto Real (Bs.) *"
                type="number"
                placeholder="0.00"
                value={montoReal}
                onChange={(e) => setMontoReal(e.target.value)}
              />
              {montoEsperado && montoReal && (
                <div className={`p-3 rounded-xl text-sm font-medium ${Number(montoReal) === Number(montoEsperado) ? 'bg-[var(--success-50)] text-[var(--success-600)] border border-[var(--success-200)]' : 'bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-200)]'}`}>
                  Diferencia: Bs. {(Number(montoReal) - Number(montoEsperado)).toFixed(2)}
                  {Number(montoReal) !== Number(montoEsperado) && (
                    <span className="block text-xs mt-1">Hay una diferencia que debe justificarse</span>
                  )}
                </div>
              )}
              <Textarea
                label="Observaciones"
                placeholder="Notas opcionales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              <Button className="w-full" size="lg" variant="premium" loading={loading} onClick={crearArqueo}>
                <ClipboardCheck className="w-4 h-4" />
                Registrar Arqueo
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Historial de Arqueos" subtitle={`${arqueos.length} registro(s)`} accent="accent" className="animate-in-up animation-delay-200">
            {arqueos.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">No hay arqueos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Esperado</th>
                      <th>Real</th>
                      <th>Diferencia</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arqueos.map((a) => {
                      const diff = Number(a.diferencia);
                      return (
                        <tr key={a.id}>
                          <td className="text-sm whitespace-nowrap">
                            {new Date(a.fecha).toLocaleString('es-ES', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="font-medium">Bs. {Number(a.montoEsperado).toFixed(2)}</td>
                          <td className="font-medium">Bs. {Number(a.montoReal).toFixed(2)}</td>
                          <td>
                            <Badge variant={diff === 0 ? 'success' : 'danger'}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="text-sm text-[var(--text-tertiary)] max-w-[200px] truncate">
                            {a.observaciones || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
