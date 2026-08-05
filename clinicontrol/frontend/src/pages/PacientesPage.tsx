import { useEffect, useState } from 'react';
import { Plus, Pencil, UserPlus, Circle, AlertTriangle, Ban, Skull, Archive } from 'lucide-react';
import { Button, Modal, Input, Select, FormSection, Card } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import type { Paciente, EstadoPaciente } from '../types';

const ESTADOS: { value: EstadoPaciente; label: string; icon: any; color: string }[] = [
  { value: 'activo', label: 'Activo', icon: Circle, color: 'text-green-600 bg-green-50' },
  { value: 'inactivo', label: 'Inactivo', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { value: 'suspendido', label: 'Suspendido', icon: Ban, color: 'text-red-600 bg-red-50' },
  { value: 'fallecido', label: 'Fallecido', icon: Skull, color: 'text-gray-500 bg-gray-100' },
  { value: 'archivado', label: 'Archivado', icon: Archive, color: 'text-blue-600 bg-blue-50' },
];

const VALIDACIONES = {
  nombre: {
    required: 'Los nombres son requeridos',
    pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/, message: 'Solo letras, mínimo 2 caracteres' },
  },
  apellido: {
    required: 'Los apellidos son requeridos',
    pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/, message: 'Solo letras, mínimo 2 caracteres' },
  },
  ci: {
    required: 'La cédula es requerida',
    pattern: { value: /^\d{5,15}$/, message: 'Solo números, entre 5 y 15 dígitos' },
  },
  telefono: {
    pattern: { value: /^(\d{7,8})?$/, message: 'Teléfono inválido (7-8 dígitos)' },
  },
  email: {
    pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de email inválido' },
  },
  fechaNacimiento: {
    required: 'La fecha de nacimiento es requerida',
    validate: (value: string) => new Date(value) < new Date() || 'La fecha no puede ser futura',
  },
  direccion: {
    minLength: { value: 5, message: 'Mínimo 5 caracteres' },
  },
};

export default function PacientesPage() {
  const { pacientes, fetchPacientes, fetchHelpers, generos, gruposSanguineos, addPaciente, updatePaciente } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [estadoTarget, setEstadoTarget] = useState<Paciente | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPaciente>('activo');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterGenero, setFilterGenero] = useState<string>('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchPacientes(); fetchHelpers(); }, []);

  const handleOpenModal = (paciente?: Paciente) => {
    setEditingPaciente(paciente || null);
    reset(paciente ? {
      nombre: paciente.nombre, apellido: paciente.apellido, ci: paciente.ci,
      fechaNacimiento: paciente.fechaNacimiento, generoId: paciente.generoId,
      telefono: paciente.telefono || '', direccion: paciente.direccion || '',
      email: paciente.email || '', grupoSanguineoId: paciente.grupoSanguineoId || '',
    } : { nombre: '', apellido: '', ci: '', fechaNacimiento: '', generoId: '', grupoSanguineoId: '', telefono: '', direccion: '', email: '' });
    setIsModalOpen(true);
  };

  const openEstadoModal = (paciente: Paciente) => {
    setEstadoTarget(paciente);
    setNuevoEstado(paciente.estado || 'activo');
    setMotivoEstado('');
    setIsEstadoModalOpen(true);
  };

  const handleChangeEstado = async () => {
    if (!estadoTarget?.id) return;
    setFormLoading(true);
    try {
      await updatePaciente(estadoTarget.id, { estado: nuevoEstado });
      toast('success', 'Estado actualizado', `Paciente ${estadoTarget.nombre} ahora: ${nuevoEstado}`);
      setIsEstadoModalOpen(false);
      setEstadoTarget(null);
      fetchPacientes();
    } catch { toast('error', 'Error al cambiar estado'); } finally { setFormLoading(false); }
  };

  const onSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        ci: data.ci,
        fechaNacimiento: data.fechaNacimiento,
        generoId: Number(data.generoId),
        telefono: data.telefono || undefined,
        direccion: data.direccion || undefined,
        email: data.email || undefined,
        grupoSanguineoId: data.grupoSanguineoId ? Number(data.grupoSanguineoId) : undefined,
      };
      if (editingPaciente?.id) {
        await updatePaciente(editingPaciente.id, payload);
        toast('success', 'Paciente actualizado');
      } else {
        await addPaciente(payload);
        toast('success', 'Paciente registrado');
      }
      setIsModalOpen(false);
      fetchPacientes();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast('error', 'No se pudo guardar', Array.isArray(msg) ? msg.join(' · ') : (msg || 'Revise los datos e intente nuevamente'));
    } finally { setFormLoading(false); }
  };

  const estadoBadge = (estado?: EstadoPaciente) => {
    const e = ESTADOS.find(x => x.value === (estado || 'activo'));
    if (!e) return null;
    const Icon = e.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${e.color}`}>
        <Icon className="w-3 h-3" />
        {e.label}
      </span>
    );
  };

  const columns: Column<Paciente>[] = [
    { key: 'nombreCompleto', header: 'Nombre', sortable: true, render: (p) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
          {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
        </div>
        <span className="font-medium text-gray-900">{p.nombre} {p.apellido}</span>
      </div>
    )},
    { key: 'ci', header: 'C.I.', sortable: true },
    { key: 'estado', header: 'Estado', render: (p) => estadoBadge(p.estado) },
    { key: 'genero', header: 'Género', sortable: true, render: (p) => (<span className="text-gray-500">{p.genero?.nombre || (generos || []).find(g => g.id === p.generoId)?.nombre || '-'}</span>) },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'acciones', header: 'Acciones', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => handleOpenModal(p)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEstadoModal(p)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <Circle className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Pacientes</h1>
            <p className="text-sm text-gray-500">{pacientes.length} registrados</p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4" />Nuevo Paciente</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">Filtros:</span>
        <button onClick={() => setFilterEstado('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterEstado ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos
        </button>
        {ESTADOS.map(e => {
          const Icon = e.icon;
          const active = filterEstado === e.value;
          return (
            <button key={e.value} onClick={() => setFilterEstado(active ? '' : e.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Icon className="w-3 h-3" />
              {e.label}
            </button>
          );
        })}
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <select value={filterGenero} onChange={e => setFilterGenero(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border-0 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <option value="">Todos los géneros</option>
          {(generos || []).map(g => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <DataTable className="table-premium" columns={columns}
          data={pacientes.filter(p => {
            if (filterEstado && p.estado !== filterEstado) return false;
            if (filterGenero && String(p.generoId) !== filterGenero) return false;
            return true;
          })}
          keyExtractor={(p) => p.id!}
          searchPlaceholder="Buscar por nombre, apellido, CI..."
          searchKeys={['nombre', 'apellido', 'ci']}
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'} size="lg">
        {editingPaciente && <p className="text-sm text-gray-500 mb-4">Editando: {editingPaciente.nombre} {editingPaciente.apellido} ({editingPaciente.ci})</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSection title="Información Personal" color="indigo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombres *" placeholder="Primer y segundo nombre" error={errors.nombre?.message as string} {...register('nombre', VALIDACIONES.nombre)} />
              <Input label="Apellidos *" placeholder="Apellido paterno y materno" error={errors.apellido?.message as string} {...register('apellido', VALIDACIONES.apellido)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input label="C.I. *" placeholder="1234567 (solo números)" error={errors.ci?.message as string} {...register('ci', VALIDACIONES.ci)} />
              <Input label="Fecha de Nacimiento *" type="date" error={errors.fechaNacimiento?.message as string} {...register('fechaNacimiento', VALIDACIONES.fechaNacimiento)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select label="Género *" placeholder="Seleccionar..." options={(generos || []).map(g => ({ value: g.id, label: g.nombre }))} error={errors.generoId?.message as string} {...register('generoId', { required: 'El género es requerido' })} />
              <Select label="Grupo Sanguíneo" placeholder="Seleccionar..." options={(gruposSanguineos || []).map(g => ({ value: g.id, label: g.nombre }))} {...register('grupoSanguineoId')} />
            </div>
          </FormSection>
          <div className="border-t border-gray-100 pt-5">
            <FormSection title="Información de Contacto" color="emerald">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Teléfono" placeholder="77712345 (7-8 dígitos)" error={errors.telefono?.message as string} {...register('telefono', VALIDACIONES.telefono)} />
                <Input label="Email" type="email" placeholder="correo@ejemplo.com" error={errors.email?.message as string} {...register('email', VALIDACIONES.email)} />
              </div>
              <div className="mt-4">
                <Input label="Dirección" placeholder="Dirección completa (mín. 5 caracteres)" error={errors.direccion?.message as string} {...register('direccion', VALIDACIONES.direccion)} />
              </div>
            </FormSection>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={formLoading}>{editingPaciente ? 'Actualizar Paciente' : 'Registrar Paciente'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEstadoModalOpen} onClose={() => setIsEstadoModalOpen(false)}
        title="Cambiar Estado del Paciente" size="sm">
        {estadoTarget && (
          <div className="space-y-5">
            <Card padding={false}>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900">{estadoTarget.nombre} {estadoTarget.apellido}</p>
                <p className="text-xs text-gray-500">CI: {estadoTarget.ci} · Estado actual: {estadoTarget.estado || 'activo'}</p>
              </div>
            </Card>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Nuevo estado:</p>
              <div className="grid grid-cols-1 gap-2">
                {ESTADOS.map(e => {
                  const Icon = e.icon;
                  const selected = nuevoEstado === e.value;
                  return (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => setNuevoEstado(e.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                        selected
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${selected ? 'bg-gray-100' : 'bg-gray-50'}`}>
                        <Icon className={`w-4 h-4 ${selected ? 'text-gray-700' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${selected ? 'text-gray-900' : 'text-gray-700'}`}>{e.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <Input
              label="Motivo del cambio"
              value={motivoEstado}
              onChange={e => setMotivoEstado(e.target.value)}
              placeholder="Opcional: explique la razón del cambio de estado"
            />
            <p className="text-xs text-gray-500 italic">El paciente no podrá agendar nuevas citas si se marca como inactivo.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsEstadoModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleChangeEstado} loading={formLoading}>
                Cambiar a {ESTADOS.find(e => e.value === nuevoEstado)?.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
