import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Stethoscope } from 'lucide-react';
import { Button, Modal, Input, Select, FormSection, StatusBadge, Card } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import type { Medico } from '../types';

const MEDICO_VALIDACIONES = {
  nombre: { required: 'El nombre es requerido', pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/, message: 'Solo letras, mínimo 2 caracteres' } },
  apellido: { required: 'El apellido es requerido', pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/, message: 'Solo letras, mínimo 2 caracteres' } },
  especialidadId: { required: 'La especialidad es requerida' },
  telefono: { pattern: { value: /^(\d{7,8})?$/, message: 'Teléfono inválido (7-8 dígitos)' } },
  email: { pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de email inválido' } },
};

export default function MedicosPage() {
  const { medicos, fetchMedicos, fetchEspecialidades, especialidades, addMedico, updateMedico, deleteMedico } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medico | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchMedicos(); fetchEspecialidades(); }, []);

  const handleOpenModal = (medico?: Medico) => {
    setEditingMedico(medico || null);
    reset(medico ? { nombre: medico.nombre, apellido: medico.apellido, especialidadId: medico.especialidadId, telefono: medico.telefono || '', email: medico.email || '' }
      : { nombre: '', apellido: '', especialidadId: '', telefono: '', email: '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        especialidadId: Number(data.especialidadId),
        telefono: data.telefono || undefined,
        email: data.email || undefined,
      };
      if (editingMedico?.id) { await updateMedico(editingMedico.id, payload); toast('success', 'Médico actualizado'); }
      else { await addMedico(payload); toast('success', 'Médico registrado'); }
      setIsModalOpen(false); fetchMedicos();
    } catch { toast('error', 'Error al guardar'); } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try { await deleteMedico(deleteTarget.id); toast('success', 'Médico eliminado'); setDeleteTarget(null); fetchMedicos(); }
    catch { toast('error', 'Error al eliminar'); } finally { setDeleteLoading(false); }
  };

  const columns: Column<Medico>[] = [
    { key: 'nombreCompleto', header: 'Nombre', sortable: true, render: (m) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
          {m.nombre?.charAt(0)}{m.apellido?.charAt(0)}
        </div>
        <span className="font-medium text-gray-900">Dr. {m.nombre} {m.apellido}</span>
      </div>
    )},
    { key: 'especialidad', header: 'Especialidad', sortable: true, render: (m) => (<StatusBadge variant="info" size="sm">{m.especialidad?.nombre || ''}</StatusBadge>) },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    { key: 'acciones', header: 'Acciones', align: 'right', render: (m) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => handleOpenModal(m)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Médicos</h1>
            <p className="text-sm text-gray-500">{medicos.length} activos</p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4" />Nuevo Médico</Button>
      </div>

      <Card padding={false}>
        <DataTable className="table-premium" columns={columns} data={medicos} keyExtractor={(m) => m.id!}
          searchPlaceholder="Buscar por nombre o especialidad..." searchKeys={['nombre', 'apellido']} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingMedico ? 'Editar Médico' : 'Nuevo Médico'} size="md">
        {editingMedico && <p className="text-sm text-gray-500 mb-4">Editando: {editingMedico.nombre} {editingMedico.apellido}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSection title="Información Personal" color="emerald">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre" placeholder="Nombre (solo letras)" required error={errors.nombre?.message as string} {...register('nombre', MEDICO_VALIDACIONES.nombre)} />
              <Input label="Apellido" placeholder="Apellido (solo letras)" required error={errors.apellido?.message as string} {...register('apellido', MEDICO_VALIDACIONES.apellido)} />
            </div>
            <div className="mt-4">
              <Select label="Especialidad" placeholder="Seleccionar..." required options={(especialidades || []).map(e => ({ value: e.id, label: e.nombre }))} error={errors.especialidadId?.message as string} {...register('especialidadId', MEDICO_VALIDACIONES.especialidadId)} />
            </div>
          </FormSection>
          <div className="border-t border-gray-100 pt-5">
            <FormSection title="Información de Contacto" color="emerald">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Teléfono" placeholder="77712345 (7-8 dígitos)" error={errors.telefono?.message as string} {...register('telefono', MEDICO_VALIDACIONES.telefono)} />
                <Input label="Email" type="email" placeholder="correo@ejemplo.com" error={errors.email?.message as string} {...register('email', MEDICO_VALIDACIONES.email)} />
              </div>
            </FormSection>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={formLoading}>{editingMedico ? 'Actualizar Médico' : 'Registrar Médico'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar Médico" message={`¿Está seguro de eliminar a ${deleteTarget?.nombre} ${deleteTarget?.apellido}?`}
        confirmText="Eliminar" variant="danger" loading={deleteLoading} />
    </div>
  );
}
