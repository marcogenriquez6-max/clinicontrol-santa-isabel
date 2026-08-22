import { useEffect, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { PageHeader, Card, Input, Select } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import { toast } from '../components/ui/Toast';
import api from '../api/axios';

interface AuditEntry {
  id: number;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
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
      const params: Record<string, string | number> = { page, limit };
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

  useEffect(() => {
    let cancelado = false;
    const init = async () => { if (!cancelado) await loadLogs(); };
    init();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        icon={ClipboardList}
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

      <Card className="!p-0 overflow-hidden">
        <DataTable
          columns={[
            { key: 'createdAt', header: 'Fecha', width: '170px', render: (e) => (
              <span className="text-xs whitespace-nowrap">{new Date(e.createdAt).toLocaleString('es-ES')}</span>
            ) },
            { key: 'userEmail', header: 'Usuario', render: (e) => e.userEmail || e.userId },
            { key: 'action', header: 'Acción', width: '120px', render: (e) => (
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                e.action === 'LOGIN' ? 'bg-[var(--success-100)] text-[var(--success-700)]' :
                e.action === 'LOGOUT' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' :
                e.action === 'DELETE' ? 'bg-[var(--danger-100)] text-[var(--danger-700)]' :
                e.action === 'CREATE' ? 'bg-[var(--info-100)] text-[var(--info-500)]' :
                'bg-[var(--warning-100)] text-[var(--warning-700)]'
              }`}>{e.action}</span>
            ) },
            { key: 'entityType', header: 'Entidad' },
            { key: 'entityId', header: 'ID', width: '80px' },
            { key: 'ipAddress', header: 'IP', width: '130px', render: (e) => (
              <span className="text-xs">{e.ipAddress || '-'}</span>
            ) },
          ]}
          data={logs}
          keyExtractor={(e) => e.id}
          searchable={false}
          loading={loading}
          emptyMessage="No se encontraron registros. Ajuste los filtros de búsqueda."
          pageSize={limit}
          server={{ page, totalPages, totalItems: total, limit, onPageChange: setPage }}
        />
      </Card>
    </div>
  );
}
