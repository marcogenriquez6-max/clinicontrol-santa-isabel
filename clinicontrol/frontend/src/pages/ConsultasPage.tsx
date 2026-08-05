import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Clock, CheckCircle, User, ArrowRight, Search } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { turnoService } from '../api/services';
import type { Turno } from '../types';

export default function ConsultasPage() {
  const navigate = useNavigate();
  const [pendientes, setPendientes] = useState<Turno[]>([]);
  const [enAtencion, setEnAtencion] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await turnoService.getAll({ limit: 200 });
      const turnos: Turno[] = Array.isArray(res) ? res : ((res as { data?: Turno[] })?.data ?? []);
      setPendientes(turnos.filter((t) => t.pagado && t.estado === 'espera'));
      setEnAtencion(turnos.filter((t) => t.estado === 'atencion'));
    } catch {
      toast('error', 'Error al cargar la cola de pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleAtender = async (turno: Turno) => {
    try {
      await turnoService.updateEstado(Number(turno.id), 'atencion');
      navigate('/consulta-completa', {
        state: {
          pacienteId: turno.pacienteId,
          pacienteNombre: turno.pacienteNombre,
          medicoId: turno.medicoId,
          turnoId: turno.id,
          turnoNumero: turno.numero,
        },
      });
    } catch {
      toast('error', 'Error al iniciar atención');
    }
  };

  const filterBySearch = (items: Turno[]): Turno[] => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(t =>
      t.pacienteNombre?.toLowerCase().includes(term) ||
      t.pacienteCI?.includes(term) ||
      String(t.numero).includes(term)
    );
  };

  const filteredPendientes = filterBySearch(pendientes);
  const filteredEnAtencion = filterBySearch(enAtencion);

  const renderTurnoCard = (turno: Turno, isEnAtencion: boolean) => (
    <div key={turno.id} className="flex items-center justify-between p-4 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
          #{turno.numero}
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{turno.pacienteNombre}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>CI: {turno.pacienteCI} · {turno.tipo || 'consulta'}</p>
          {turno.monto > 0 && (
            <p className="text-xs text-green-600 font-medium">Pagado Bs. {Number(turno.monto).toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={isEnAtencion ? 'info' : 'success'}>
          {isEnAtencion ? 'En Atención' : 'Pagado'}
        </Badge>
        {!isEnAtencion && (
          <Button size="sm" onClick={() => handleAtender(turno)}>
            <ArrowRight className="w-4 h-4" /> Atender
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 mb-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Consultas</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Pacientes listos para atención médica</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span>{pendientes.length} pendientes</span>
          <span style={{ color: 'var(--border-primary)' }}>·</span>
          <span>{enAtencion.length} en atención</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, CI o turno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          ))}
        </div>
      ) : (
        <>
          {filteredEnAtencion.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> En Atención</span>}>
              <div className="space-y-2">
                {filteredEnAtencion.map(t => renderTurnoCard(t, true))}
              </div>
            </Card>
          )}

          <Card title={<span className="flex items-center gap-2"><User className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Pacientes Pagados - En Espera</span>}>
            {filteredPendientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-12 h-12 mb-3" style={{ color: 'var(--border-primary)' }} />
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No hay pacientes pendientes</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Los pacientes pagados aparecerán aquí automáticamente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPendientes.map(t => renderTurnoCard(t, false))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
