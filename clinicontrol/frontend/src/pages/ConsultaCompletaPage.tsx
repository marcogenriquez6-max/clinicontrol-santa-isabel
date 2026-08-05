import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Calendar, Shield, ArrowLeft, Printer } from 'lucide-react';
import { Button, Card, Input, Select, Textarea, Modal } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { useStore } from '../store';
import {
  consultaCompletaService, recetaService, interaccionService, citaService, diagnosticoService, turnoService
} from '../api/services';
import VitalSignsGrid from '../components/consulta/VitalSignsGrid';
import DiagnosticoList from '../components/consulta/DiagnosticoList';
import MedicamentoList from '../components/consulta/MedicamentoList';
import SafetyVerificationModal from '../components/consulta/SafetyVerificationModal';
import type { ConsultaCompletaDto, Cita } from '../types';

const PRINT_STYLES = `
@media print {
  @page { margin: 15mm; size: A4; }
  body * { visibility: hidden; }
  #reporte-consulta, #reporte-consulta * { visibility: visible; }
  #reporte-consulta { position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: white; font-family: 'Inter', sans-serif; z-index: 9999; overflow-y: auto; }
  #reporte-consulta .no-print { display: none !important; }
}`;

interface DiagnosticoEntry {
  key: number;
  cie10Search: string;
  cie10Id?: number;
  descripcion: string;
  tipo: 'principal' | 'secundario' | 'complicacion' | 'cronico';
  esCronico: boolean;
}

interface MedicamentoEntry {
  key: number;
  search: string;
  medicamentoId?: number;
  medicamentoNombre?: string;
  dosis: string;
  frecuencia: string;
  via: string;
  duracion: string;
  cantidad: number;
  observaciones: string;
}

interface FormData {
  pacienteId: string;
  medicoId: string;
  citaId: string;
  esPrimeraVez: boolean;
  esContinuacion: boolean;
  consultaOriginalId: string;
  motivoConsulta: string;
  sintomas: string;
  enfermedadActual: string;
  peso: string;
  talla: string;
  temperatura: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  presionArterialSistolica: string;
  presionArterialDiastolica: string;
  saturacionOxigeno: string;
  glucosaCapilar: string;
  examenFisico: string;
  evaluacion: string;
  planTratamiento: string;
  indicaciones: string;
  proximoControl: string;
  incapacidadDias: string;
  incapacidadFechaInicio: string;
  incapacidadFechaFin: string;
}



const VALIDACION = {
  REQUIRED: { required: 'Campo requerido' },
  MIN5: { required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } },
  PESO: { required: 'Campo requerido', min: { value: 0.5, message: 'Mínimo 0.5 kg' }, max: { value: 500, message: 'Máximo 500 kg' } },
  TALLA: { required: 'Campo requerido', min: { value: 10, message: 'Mínimo 10 cm' }, max: { value: 280, message: 'Máximo 280 cm' } },
  TEMP: { min: { value: 34, message: 'Mínimo 34°C' }, max: { value: 43, message: 'Máximo 43°C' } },
  FC: { min: { value: 20, message: 'Mínimo 20 lpm' }, max: { value: 250, message: 'Máximo 250 lpm' } },
  FR: { min: { value: 4, message: 'Mínimo 4 rpm' }, max: { value: 80, message: 'Máximo 80 rpm' } },
  PA: { min: { value: 30, message: 'Mínimo 30 mmHg' }, max: { value: 300, message: 'Máximo 300 mmHg' } },
  SPO2: { min: { value: 30, message: 'Mínimo 30%' }, max: { value: 100, message: 'Máximo 100%' } },
  GLUCOSA: { min: { value: 20, message: 'Mínimo 20 mg/dL' }, max: { value: 700, message: 'Máximo 700 mg/dL' } },
  INCAPACIDAD: { min: { value: 1, message: 'Mínimo 1 día' }, max: { value: 365, message: 'Máximo 365 días' } },
};

export default function ConsultaCompletaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state as { pacienteId?: number; medicoId?: number; turnoId?: number; turnoNumero?: number; pacienteNombre?: string } | null;
  const { pacientes, medicos, fetchPacientes, fetchMedicos } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [turnoId] = useState(navState?.turnoId ?? null);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      pacienteId: navState?.pacienteId ? String(navState.pacienteId) : '',
      medicoId: navState?.medicoId ? String(navState.medicoId) : '',
      citaId: '',
      esPrimeraVez: false,
      esContinuacion: false,
      consultaOriginalId: '',
      motivoConsulta: '',
      sintomas: '',
      enfermedadActual: '',
      peso: '',
      talla: '',
      temperatura: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      presionArterialSistolica: '',
      presionArterialDiastolica: '',
      saturacionOxigeno: '',
      glucosaCapilar: '',
      examenFisico: '',
      evaluacion: '',
      planTratamiento: '',
      indicaciones: '',
      proximoControl: '',
      incapacidadDias: '',
      incapacidadFechaInicio: '',
      incapacidadFechaFin: '',
    },
  });

  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoEntry[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoEntry[]>([]);
  const [citasPaciente, setCitasPaciente] = useState<Cita[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [medSearchResults, setMedSearchResults] = useState<Record<number, any[]>>({});
  const [cieSearchResults, setCieSearchResults] = useState<Record<number, any[]>>({});
  const [nextDiagKey, setNextDiagKey] = useState(1);
  const [nextMedKey, setNextMedKey] = useState(1);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [interaccionModalOpen, setInteraccionModalOpen] = useState(false);
  const [interaccionData, setInteraccionData] = useState<any[]>([]);
  const [safetyPacienteId, setSafetyPacienteId] = useState(0);
  const [safetyMedIds, setSafetyMedIds] = useState<number[]>([]);

  const pacienteId = watch('pacienteId');
  const peso = watch('peso');
  const talla = watch('talla');
  const esContinuacion = watch('esContinuacion');

  useEffect(() => {
    fetchPacientes();
    fetchMedicos();
  }, []);

  useEffect(() => {
    if (pacienteId) {
      citaService.getByPaciente(Number(pacienteId)).then((res) => {
        const pendientes = res.data.filter((c) => c.estado?.nombre?.toLowerCase() === 'pendiente' || !c.estadoId);
        setCitasPaciente(pendientes);
      }).catch(() => setCitasPaciente([]));
    } else {
      setCitasPaciente([]);
    }
  }, [pacienteId]);

  const addDiagnostico = () => {
    setDiagnosticos([...diagnosticos, {
      key: nextDiagKey,
      cie10Search: '',
      descripcion: '',
      tipo: 'secundario',
      esCronico: false,
    }]);
    setNextDiagKey(nextDiagKey + 1);
  };

  const removeDiagnostico = (key: number) => {
    setDiagnosticos(diagnosticos.filter((d) => d.key !== key));
  };

  const updateDiagnostico = (key: number, field: keyof DiagnosticoEntry, value: any) => {
    setDiagnosticos((prev) => prev.map((d) => d.key === key ? { ...d, [field]: value } : d));
  };

  const addMedicamento = () => {
    setMedicamentos([...medicamentos, {
      key: nextMedKey,
      search: '',
      dosis: '',
      frecuencia: '',
      via: '',
      duracion: '',
      cantidad: 0,
      observaciones: '',
    }]);
    setNextMedKey(nextMedKey + 1);
  };

  const removeMedicamento = (key: number) => {
    setMedicamentos(medicamentos.filter((m) => m.key !== key));
  };

  const updateMedicamento = (key: number, field: keyof MedicamentoEntry, value: any) => {
    // Updater funcional: selectMedicamento hace varias actualizaciones seguidas;
    // con el closure directo se pisaban entre sí y se perdía medicamentoId.
    setMedicamentos((prev) => prev.map((m) => m.key === key ? { ...m, [field]: value } : m));
  };

  const handleCieSearch = async (key: number, query: string) => {
    updateDiagnostico(key, 'cie10Search', query);
    if (query.length < 2) return;
    try {
      const res = await diagnosticoService.searchCie10(query);
      setCieSearchResults({ ...cieSearchResults, [key]: res.data });
    } catch {
      setCieSearchResults({ ...cieSearchResults, [key]: [] });
    }
  };

  const selectCie = (key: number, item: any) => {
    updateDiagnostico(key, 'cie10Search', `${item.codigo} - ${item.descripcion}`);
    updateDiagnostico(key, 'cie10Id', item.id);
    updateDiagnostico(key, 'descripcion', item.descripcion || '');
    setCieSearchResults({ ...cieSearchResults, [key]: [] });
  };

  const handleMedSearch = async (key: number, query: string) => {
    updateMedicamento(key, 'search', query);
    if (query.length < 2) return;
    try {
      const res = await recetaService.searchMedicamentos(query);
      setMedSearchResults({ ...medSearchResults, [key]: res.data });
    } catch {
      setMedSearchResults({ ...medSearchResults, [key]: [] });
    }
  };

  const selectMedicamento = (key: number, item: any) => {
    updateMedicamento(key, 'search', item.nombre);
    updateMedicamento(key, 'medicamentoId', item.id);
    updateMedicamento(key, 'medicamentoNombre', item.nombre);
    setMedSearchResults({ ...medSearchResults, [key]: [] });
  };

  const getPacienteNombre = () => {
    const id = Number(pacienteId);
    if (!id) return navState?.pacienteNombre || '';
    const p = pacientes?.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : navState?.pacienteNombre || '';
  };

  const getMedicoNombre = () => {
    const medId = watch('medicoId');
    if (!medId) return '';
    const m = medicos?.find(x => x.id === Number(medId));
    return m ? `Dr. ${m.nombre} ${m.apellido}` : '';
  };

  const getMedicoEspecialidad = () => {
    const medId = watch('medicoId');
    if (!medId) return '';
    const m = medicos?.find(x => x.id === Number(medId));
    return m?.especialidad?.nombre || '';
  };

  const handlePrintReport = () => {
    const styleTag = document.createElement('style');
    styleTag.id = 'print-styles-consulta';
    styleTag.textContent = PRINT_STYLES;
    document.head.appendChild(styleTag);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const existing = document.getElementById('print-styles-consulta');
        if (existing) existing.remove();
      }, 500);
    }, 300);
  };

  const verificarInteracciones = async () => {
    const ids = medicamentos
      .map((m) => m.medicamentoId)
      .filter((id): id is number => id != null);
    if (ids.length < 2) {
      toast('info', 'Agregue al menos 2 medicamentos');
      return;
    }
    try {
      const res = await interaccionService.verificar(ids);
      setInteraccionData(res.data || []);
      setInteraccionModalOpen(true);
    } catch (error) {
      toast('error', 'Error', 'No se pudieron verificar las interacciones.');
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: ConsultaCompletaDto = {
        pacienteId: Number(data.pacienteId),
        medicoId: Number(data.medicoId),
        citaId: data.citaId ? Number(data.citaId) : undefined,
        motivoConsulta: data.motivoConsulta,
        sintomas: data.sintomas,
        enfermedadActual: data.enfermedadActual,
        examenFisico: data.examenFisico,
        peso: data.peso ? Number(data.peso) : undefined,
        talla: data.talla ? Number(data.talla) : undefined,
        temperatura: data.temperatura ? Number(data.temperatura) : undefined,
        frecuenciaCardiaca: data.frecuenciaCardiaca ? Number(data.frecuenciaCardiaca) : undefined,
        frecuenciaRespiratoria: data.frecuenciaRespiratoria ? Number(data.frecuenciaRespiratoria) : undefined,
        presionArterialSistolica: data.presionArterialSistolica ? Number(data.presionArterialSistolica) : undefined,
        presionArterialDiastolica: data.presionArterialDiastolica ? Number(data.presionArterialDiastolica) : undefined,
        saturacionOxigeno: data.saturacionOxigeno ? Number(data.saturacionOxigeno) : undefined,
        glucosaCapilar: data.glucosaCapilar ? Number(data.glucosaCapilar) : undefined,
        evaluacion: data.evaluacion,
        planTratamiento: data.planTratamiento,
        indicaciones: data.indicaciones,
        diagnosticos: diagnosticos.map((d) => ({
          cie10Id: d.cie10Id,
          descripcion: d.descripcion,
          tipo: d.tipo,
          esCronico: d.esCronico,
        })),
        recetas: medicamentos.map((m) => ({
          medicamentoId: m.medicamentoId!,
          dosis: m.dosis,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          cantidad: m.cantidad,
          observaciones: m.observaciones,
        })),
      };
      if (data.esContinuacion && data.consultaOriginalId) {
        await consultaCompletaService.continuar(Number(data.consultaOriginalId), payload);
      } else {
        await consultaCompletaService.createCompleta(payload);
      }
      toast('success', 'Consulta guardada', 'La consulta médica fue registrada exitosamente');
      if (turnoId) {
        await turnoService.updateEstado(turnoId, 'completado');
      }
      reset();
      setDiagnosticos([]);
      setMedicamentos([]);
      setCitasPaciente([]);
      if (turnoId) {
        navigate('/consultas');
        return;
      }
    } catch (error) {
      toast('error', 'Error', 'No se pudo guardar la consulta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in-up max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          {turnoId && (
            <button onClick={() => navigate('/consultas')} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {turnoId ? `Atención Turno #${navState?.turnoNumero ?? ''}` : 'Nueva Consulta'}
            </h1>
            <p className="text-sm text-gray-500">
              {turnoId ? `Paciente: ${navState?.pacienteNombre ?? ''}` : 'Registro de consulta médica'}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={handlePrintReport}>
          <Printer className="w-4 h-4" /> Reporte
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient & Doctor Selection */}
        <Card title="Paciente y Médico" subtitle="Seleccione los participantes de la consulta" className="bg-white dark:bg-[var(--bg-card)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Paciente"
              required
              options={[
                { value: '', label: 'Seleccionar paciente...' },
                 ...(pacientes || []).map((p) => ({
                  value: String(p.id),
                  label: `${p.nombre} ${p.apellido} (${p.ci})`,
                })),
              ]}
              error={errors.pacienteId?.message as string}
              {...register('pacienteId', { required: 'El paciente es requerido' })}
            />
            <Select
              label="Médico"
              required
              options={[
                { value: '', label: 'Seleccionar médico...' },
                ...(medicos || []).map((m) => ({
                  value: String(m.id),
                  label: `Dr. ${m.nombre} ${m.apellido} - ${m.especialidad?.nombre || ''}`,
                })),
              ]}
              error={errors.medicoId?.message as string}
              {...register('medicoId', { required: 'El médico es requerido' })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Cita (opcional)"
              options={[
                { value: '', label: 'Sin cita asociada...' },
                ...(citasPaciente || []).map((c) => ({
                  value: String(c.id),
                  label: `${new Date(c.fecha).toLocaleDateString()} - Dr. ${c.medico?.nombre || ''}`,
                })),
              ]}
              {...register('citaId')}
            />
            <div />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" className="rounded border-[var(--border-primary)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]" {...register('esPrimeraVez')} />
              Es primera vez
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" className="rounded border-[var(--border-primary)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]" {...register('esContinuacion')} />
              Es continuación
            </label>
            {esContinuacion && (
              <Input
                label="ID Consulta original"
                type="number"
                className="max-w-[200px]"
                placeholder="ID..."
                {...register('consultaOriginalId')}
              />
            )}
          </div>
        </Card>

        {/* S - Subjetivo */}
        <Card title={<><FileText className="w-5 h-5 inline mr-2 text-black dark:text-[var(--info-500)]" />S - Subjetivo</>} subtitle="Información subjetiva del paciente" className="bg-white dark:bg-[var(--bg-card)] border-l-4 border-l-[var(--info-500)]">
          <div className="space-y-4">
            <Textarea label="Motivo de consulta" required placeholder="¿Por qué consulta el paciente?" rows={3} error={errors.motivoConsulta?.message as string} {...register('motivoConsulta', VALIDACION.MIN5)} />
            <Textarea label="Síntomas" placeholder="Describa los síntomas del paciente..." rows={4} error={errors.sintomas?.message as string} {...register('sintomas')} />
            <Textarea label="Enfermedad actual" placeholder="Historia de la enfermedad actual..." rows={4} error={errors.enfermedadActual?.message as string} {...register('enfermedadActual')} />
          </div>
        </Card>

        {/* O - Objetivo */}
        <Card title={<><FileText className="w-5 h-5 inline mr-2 text-black dark:text-[var(--success-600)]" />O - Objetivo</>} subtitle="Signos vitales y hallazgos objetivos" className="bg-white dark:bg-[var(--bg-card)] border-l-4 border-l-[var(--success-500)]">
          <VitalSignsGrid register={register} errors={errors} peso={peso} talla={talla} />
          <Textarea label="Examen físico" required placeholder="Hallazgos del examen físico..." rows={4} error={errors.examenFisico?.message as string} {...register('examenFisico', VALIDACION.REQUIRED)} />
        </Card>

        {/* A - Assessment */}
        <Card title={<><FileText className="w-5 h-5 inline mr-2 text-black dark:text-[var(--warning-600)]" />A - Evaluación</>} subtitle="Evaluación y diagnósticos" className="bg-white dark:bg-[var(--bg-card)] border-l-4 border-l-[var(--warning-500)]">
          <Textarea label="Evaluación" required placeholder="Evaluación del médico..." rows={4} error={errors.evaluacion?.message as string} {...register('evaluacion', VALIDACION.REQUIRED)} />
          <DiagnosticoList
            diagnosticos={diagnosticos}
            onAdd={addDiagnostico}
            onRemove={removeDiagnostico}
            onUpdate={updateDiagnostico}
            onCieSearch={handleCieSearch}
            onSelectCie={selectCie}
            cieSearchResults={cieSearchResults}
          />
        </Card>

        {/* P - Plan */}
        <Card title={<><FileText className="w-5 h-5 inline mr-2 text-black dark:text-[var(--accent-600)]" />P - Plan</>} subtitle="Plan de tratamiento y recetas" className="bg-white dark:bg-[var(--bg-card)] border-l-4 border-l-[var(--accent-500)]">
          <Textarea label="Plan de tratamiento" required placeholder="Describa el plan de tratamiento..." rows={3} error={errors.planTratamiento?.message as string} {...register('planTratamiento', VALIDACION.MIN5)} />
          <div className="mt-4">
            <Textarea label="Indicaciones" placeholder="Indicaciones para el paciente..." rows={3} {...register('indicaciones')} />
          </div>
          <MedicamentoList
            medicamentos={medicamentos}
            onAdd={addMedicamento}
            onRemove={removeMedicamento}
            onUpdate={updateMedicamento}
            onMedSearch={handleMedSearch}
            onSelectMed={selectMedicamento}
            medSearchResults={medSearchResults}
            onVerificarSeguridad={() => {
              const id = Number(pacienteId);
              if (!id) { toast('warning', 'Seleccione un paciente'); return; }
              const ids = medicamentos.map(m => m.medicamentoId).filter((id): id is number => id != null);
              if (ids.length === 0) { toast('info', 'Agregue al menos 1 medicamento'); return; }
              setSafetyPacienteId(id);
              setSafetyMedIds(ids);
              setSafetyModalOpen(true);
            }}
            onVerificarInteracciones={verificarInteracciones}
          />

          {/* Próximo control */}
          <div className="mt-6">
            <div className="relative">
              <Calendar className="absolute left-3 top-9 w-4 h-4 text-[var(--text-tertiary)]" />
              <Input label="Próximo control" type="date" className="pl-10" {...register('proximoControl')} />
            </div>
          </div>

          {/* Incapacidad */}
          <div className="mt-6 p-4 border border-[var(--border-primary)] rounded-lg">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Incapacidad médica</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Días de incapacidad" type="number" placeholder="Ej: 3" error={errors.incapacidadDias?.message as string} {...register('incapacidadDias', { ...VALIDACION.INCAPACIDAD })} />
              <Input label="Fecha inicio" type="date" error={errors.incapacidadFechaInicio?.message as string} {...register('incapacidadFechaInicio')} />
              <Input label="Fecha fin" type="date" error={errors.incapacidadFechaFin?.message as string} {...register('incapacidadFechaFin')} />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" loading={submitting}>
            <FileText className="w-5 h-5 mr-2" />Guardar Consulta Completa
          </Button>
        </div>
      </form>

      <SafetyVerificationModal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        pacienteId={safetyPacienteId}
        medicamentoIds={safetyMedIds}
      />

      {/* Interacciones Modal */}
      <Modal isOpen={interaccionModalOpen} onClose={() => setInteraccionModalOpen(false)} title="Interacciones Medicamentosas" size="lg">
        {interaccionData.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-[var(--success-100)] mx-auto mb-3" />
            <p className="text-lg font-semibold text-[var(--success-700)]">Sin interacciones</p>
            <p className="text-sm text-[var(--text-tertiary)]">No se encontraron interacciones entre los medicamentos seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {[...interaccionData].sort((a, b) => {
              const order = ['contraindicada', 'severa', 'moderada', 'leve'];
              return order.indexOf(a.severidad) - order.indexOf(b.severidad);
            }).map((i, idx) => (
              <div key={idx} className="relative p-4 bg-[var(--bg-secondary)] rounded-lg border border-l-4" style={{ borderLeftColor: i.severidad === 'contraindicada' ? 'var(--danger-600)' : i.severidad === 'severa' ? 'var(--danger-500)' : i.severidad === 'moderada' ? 'var(--warning-500)' : 'var(--warning-500)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${i.severidad === 'contraindicada' ? 'bg-[var(--danger-600)]' : i.severidad === 'severa' ? 'bg-[var(--danger-500)]' : i.severidad === 'moderada' ? 'bg-[var(--warning-500)]' : 'bg-[var(--warning-500)]'}`}>
                    {i.severidad?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{i.descripcion}</p>
                {i.efecto && <p className="text-sm text-[var(--text-tertiary)] mt-1">Efecto: {i.efecto}</p>}
                {i.recomendacion && <p className="text-sm text-[var(--text-tertiary)]">Recomendación: {i.recomendacion}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={() => setInteraccionModalOpen(false)}>Cerrar</Button>
        </div>
      </Modal>

      {/* Print Report */}
      <div ref={printRef} id="reporte-consulta" style={{ display: 'none' }}>
        <div style={{ padding: '40px', maxWidth: '210mm', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#111' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '2px solid #111', paddingBottom: '20px', marginBottom: '24px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0', color: '#111' }}>CLÍNICA SANTA ISABEL</h1>
              <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>Sistema de Gestión Hospitalaria</p>
              <p style={{ fontSize: '11px', color: '#999', margin: '2px 0' }}>Reporte de Consulta Médica</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '11px', color: '#666' }}>
              <p style={{ margin: '2px 0' }}>Fecha: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style={{ margin: '2px 0' }}>Hora: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              {turnoId && <p style={{ margin: '2px 0', fontWeight: '600', color: '#111' }}>Turno #{navState?.turnoNumero}</p>}
            </div>
          </div>

          {/* Patient & Doctor */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 12px', background: '#f5f5f5', fontWeight: '600', width: '120px', border: '1px solid #e0e0e0' }}>Paciente</td>
                <td style={{ padding: '6px 12px', border: '1px solid #e0e0e0' }}>{getPacienteNombre() || '—'}</td>
                <td style={{ padding: '6px 12px', background: '#f5f5f5', fontWeight: '600', width: '120px', border: '1px solid #e0e0e0' }}>Médico</td>
                <td style={{ padding: '6px 12px', border: '1px solid #e0e0e0' }}>{getMedicoNombre() || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 12px', background: '#f5f5f5', fontWeight: '600', border: '1px solid #e0e0e0' }}>Especialidad</td>
                <td style={{ padding: '6px 12px', border: '1px solid #e0e0e0' }}>{getMedicoEspecialidad() || '—'}</td>
                <td style={{ padding: '6px 12px', background: '#f5f5f5', fontWeight: '600', border: '1px solid #e0e0e0' }}>Tipo</td>
                <td style={{ padding: '6px 12px', border: '1px solid #e0e0e0' }}>{watch('esPrimeraVez') ? 'Primera vez' : watch('esContinuacion') ? 'Continuación' : 'Regular'}</td>
              </tr>
            </tbody>
          </table>

          {/* SOAP */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', padding: '8px 12px', background: '#111', color: '#fff', borderRadius: '4px' }}>S - Subjetivo</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr><td style={{ padding: '8px 12px', background: '#f9f9f9', fontWeight: '600', width: '140px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>Motivo de Consulta</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{watch('motivoConsulta') || '—'}</td></tr>
                <tr><td style={{ padding: '8px 12px', background: '#f9f9f9', fontWeight: '600', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>Síntomas</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{watch('sintomas') || '—'}</td></tr>
                <tr><td style={{ padding: '8px 12px', background: '#f9f9f9', fontWeight: '600', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>Enfermedad Actual</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{watch('enfermedadActual') || '—'}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Vital Signs */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', padding: '8px 12px', background: '#111', color: '#fff', borderRadius: '4px' }}>O - Objetivo (Signos Vitales)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Peso', 'Talla', 'Temperatura', 'FC', 'FR', 'PA', 'SpO₂', 'Glucosa'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[watch('peso') ? `${watch('peso')} kg` : '—', watch('talla') ? `${watch('talla')} cm` : '—', watch('temperatura') ? `${watch('temperatura')}°C` : '—', watch('frecuenciaCardiaca') ? `${watch('frecuenciaCardiaca')} lpm` : '—', watch('frecuenciaRespiratoria') ? `${watch('frecuenciaRespiratoria')} rpm` : '—', watch('presionArterialSistolica') ? `${watch('presionArterialSistolica')}/${watch('presionArterialDiastolica') || '?'} mmHg` : '—', watch('saturacionOxigeno') ? `${watch('saturacionOxigeno')}%` : '—', watch('glucosaCapilar') ? `${watch('glucosaCapilar')} mg/dL` : '—'].map((v, i) => (
                    <td key={i} style={{ padding: '8px 10px', border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: '500' }}>{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Exam */}
          {watch('examenFisico') && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', padding: '8px 12px', background: '#111', color: '#fff', borderRadius: '4px' }}>Examen Físico</h3>
              <p style={{ fontSize: '13px', margin: '0', padding: '10px 12px', background: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{watch('examenFisico')}</p>
            </div>
          )}

          {/* Assessment */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', padding: '8px 12px', background: '#111', color: '#fff', borderRadius: '4px' }}>A - Evaluación y Diagnósticos</h3>
            {watch('evaluacion') && <p style={{ fontSize: '13px', margin: '0 0 10px 0', padding: '10px 12px', background: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{watch('evaluacion')}</p>}
            {diagnosticos.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '6px 10px', border: '1px solid #e0e0e0', fontSize: '11px', fontWeight: '600', textAlign: 'left' }}>Diagnóstico</th>
                    <th style={{ padding: '6px 10px', border: '1px solid #e0e0e0', fontSize: '11px', fontWeight: '600', textAlign: 'center', width: '100px' }}>Tipo</th>
                    <th style={{ padding: '6px 10px', border: '1px solid #e0e0e0', fontSize: '11px', fontWeight: '600', textAlign: 'center', width: '80px' }}>Crónico</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticos.map((d) => (
                    <tr key={d.key}>
                      <td style={{ padding: '6px 10px', border: '1px solid #e0e0e0' }}>{d.cie10Search || d.descripcion || '—'}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e0e0e0', textAlign: 'center', textTransform: 'capitalize' }}>{d.tipo}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{d.esCronico ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Plan */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', padding: '8px 12px', background: '#111', color: '#fff', borderRadius: '4px' }}>P - Plan</h3>
            {watch('planTratamiento') && <p style={{ fontSize: '13px', margin: '0 0 10px 0', padding: '10px 12px', background: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{watch('planTratamiento')}</p>}
            {watch('indicaciones') && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 4px 0' }}>Indicaciones:</p>
                <p style={{ fontSize: '13px', margin: '0', padding: '8px 12px', background: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{watch('indicaciones')}</p>
              </div>
            )}
            {medicamentos.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 4px 0' }}>Medicamentos Recetados:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'left' }}>Medicamento</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>Dosis</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>Frecuencia</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>Duración</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>Cant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicamentos.map((m) => (
                      <tr key={m.key}>
                        <td style={{ padding: '5px 8px', border: '1px solid #e0e0e0' }}>{m.medicamentoNombre || m.search || '—'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{m.dosis || '—'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{m.frecuencia || '—'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{m.duracion || '—'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{m.cantidad || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {watch('proximoControl') && (
              <p style={{ fontSize: '13px', margin: '8px 0' }}>
                <strong>Próximo control:</strong> {new Date(watch('proximoControl')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Incapacidad */}
          {(watch('incapacidadDias') || watch('incapacidadFechaInicio')) && (
            <div style={{ marginBottom: '24px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', background: '#fafafa' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 6px 0' }}>Incapacidad Médica</p>
              {watch('incapacidadDias') && <p style={{ fontSize: '13px', margin: '2px 0' }}>Días: {watch('incapacidadDias')}</p>}
              {watch('incapacidadFechaInicio') && <p style={{ fontSize: '13px', margin: '2px 0' }}>Desde: {new Date(watch('incapacidadFechaInicio')).toLocaleDateString('es-ES')}</p>}
              {watch('incapacidadFechaFin') && <p style={{ fontSize: '13px', margin: '2px 0' }}>Hasta: {new Date(watch('incapacidadFechaFin')).toLocaleDateString('es-ES')}</p>}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Médico tratante</p>
              <div style={{ marginTop: '30px', width: '200px', borderTop: '1px solid #333' }} />
              <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>{getMedicoNombre() || '—'}</p>
              <p style={{ margin: '0', fontSize: '11px' }}>{getMedicoEspecialidad() || '—'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Paciente</p>
              <div style={{ marginTop: '30px', width: '200px', borderTop: '1px solid #333', marginLeft: 'auto' }} />
              <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>{getPacienteNombre() || '—'}</p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '10px', color: '#aaa', marginTop: '20px' }}>
            Este documento es un reporte generado por el sistema Clínica Santa Isabel.
          </p>
        </div>
      </div>
    </div>
  );
}
