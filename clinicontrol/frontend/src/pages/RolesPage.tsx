import { useEffect, useState } from 'react';
import { Shield, Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Button, Modal, Input } from '../components/ui';
import { rolService } from '../api/services';
import api from '../api/axios';
import type { Rol } from '../types';
import Swal from 'sweetalert2';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'from-red-500 to-rose-600',
  DOCTOR: 'from-blue-500 to-indigo-600',
  RECEPCION: 'from-violet-500 to-purple-600',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await rolService.getAll();
      setRoles(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadRoles(); }, []);

  const openCreate = () => {
    setEditingRol(null);
    setFormData({ nombre: '', descripcion: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (rol: Rol) => {
    setEditingRol(rol);
    setFormData({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) errs.nombre = 'El nombre del rol es requerido';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (editingRol) {
        await api.put(`/roles/${editingRol.id}`, formData);
      } else {
        await api.post('/roles', formData);
      }
      Swal.fire({ icon: 'success', title: editingRol ? 'Actualizado' : 'Creado', timer: 1500, showConfirmButton: false });
      setModalOpen(false);
      loadRoles();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error al guardar' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        icon={Shield}
        gradient="from-purple-500 to-pink-600"
        title="Roles y Permisos"
        subtitle="Administración de roles del sistema"
        stats={[{ label: 'roles', value: roles.length }]}
        action={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Nuevo Rol
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}><div className="animate-pulse h-32 bg-[var(--bg-tertiary)] rounded-xl" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(rol => {
            const gradient = ROLE_COLORS[rol.nombre] || 'from-gray-500 to-gray-600';
            return (
              <Card key={rol.id}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <button onClick={() => openEdit(rol)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--primary-600)] hover:bg-[var(--primary-50)] transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{rol.nombre}</h3>
                    {rol.descripcion && (
                      <p className="text-sm text-[var(--text-tertiary)] mt-1">{rol.descripcion}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRol ? 'Editar Rol' : 'Nuevo Rol'}>
        {editingRol && <p className="text-sm text-[var(--text-secondary)] mb-4">Editando: {editingRol.nombre}</p>}
        <div className="space-y-5">
          <Input label="Nombre del rol" required value={formData.nombre} onChange={e => { setFormData(p => ({ ...p, nombre: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.nombre; return n; }); }} error={formErrors.nombre} placeholder="Ej: ADMIN" />
          <Input label="Descripción" value={formData.descripcion} onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del rol" />
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingRol ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
