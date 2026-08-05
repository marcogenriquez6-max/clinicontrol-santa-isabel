import { useEffect, useState } from 'react';
import { ClipboardList, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { PageHeader, Card, Input, Select } from '../components/ui';
import { toast } from '../components/ui/Toast';
import api from '../api/axios';

interface AuditEntry {
  id: number;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entityType: '', userId: '', action: '' });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 30;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      const res = await api.get('/audit', { params });
      const data = res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
      setTotal(res.data?.meta?.total || 0);
    } catch (error) {
      toast('error', 'Error', 'No se pudieron cargar los registros de auditoría');
      console.error('Error loading audit logs:', error);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        icon={ClipboardList}
        gradient="from-slate-600 to-slate-800"
        title="Registro de Auditoría"
        subtitle="Todas las acciones del sistema"
        stats={[{ label: 'registros', value: total }]}
      />

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Input label="Tipo entidad" value={filters.entityType} onChange={e => setFilters(p => ({ ...p, entityType: e.target.value }))} placeholder="Ej: usuario, cita" />
          <Input label="Email usuario" value={filters.userId} onChange={e => setFilters(p => ({ ...p, userId: e.target.value }))} placeholder="email@ejemplo.com" />
          <Select label="Acción" value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} options={[
            { value: '', label: 'Todas' },
            { value: 'LOGIN', label: 'Login' },
            { value: 'LOGOUT', label: 'Logout' },
            { value: 'CREATE', label: 'Creación' },
            { value: 'UPDATE', label: 'Actualización' },
            { value: 'DELETE', label: 'Eliminación' },
          ]} />
          <button onClick={handleFilter} className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-lg text-sm hover:bg-[var(--primary-700)] transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Filtrar
          </button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
            <Inbox className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No se encontraron registros</p>
            <p className="text-xs mt-1">Intente ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-premium">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  {['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => (
                  <tr key={entry.id} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{entry.userEmail || entry.userId}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        entry.action === 'LOGIN' ? 'bg-[var(--success-100)] text-[var(--success-700)]' :
                        entry.action === 'LOGOUT' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' :
                        entry.action === 'DELETE' ? 'bg-[var(--danger-100)] text-[var(--danger-700)]' :
                        entry.action === 'CREATE' ? 'bg-[var(--info-100)] text-[var(--info-500)]' :
                        'bg-[var(--warning-100)] text-[var(--warning-700)]'
                      }`}>{entry.action}</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{entry.entityType}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{entry.entityId}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-tertiary)]">{entry.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
            <span className="text-sm text-[var(--text-tertiary)]">{(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-[var(--text-primary)]">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
