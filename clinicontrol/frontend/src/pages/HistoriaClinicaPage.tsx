import { useEffect, useState, useRef } from 'react';
import { Search, User, Activity, Pill, Calendar, Heart, Thermometer, Weight, FileText, Clock, Stethoscope, ChevronRight, Pencil, Trash2, Printer, X } from 'lucide-react';
import { Button, Card, Modal, Input, StatusBadge, severityToStatus } from '../components/ui';
import { toast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { pacienteExtraService, consultaCompletaService, cirugiaService } from '../api/services';
import type { Paciente, PerfilPaciente, CirugiaPrevia } from '../types';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatDateShort = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

const DIAGNOSTICOS_FILTER = ['Todos', 'CARDIOVASCULAR', 'RESPIRATORIO', 'INFECCIOSO', 'TRAUMATOLOGICO', 'NEUROLOGICO', 'ONCOLOGICO', 'OTRO'];

export default function HistoriaClinicaPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Paciente[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [alergias, setAlergias] = useState<any[]>([]);
  const [cirugias, setCirugias] = useState<CirugiaPrevia[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showCirugiaModal, setShowCirugiaModal] = useState(false);
  const [editingCirugia, setEditingCirugia] = useState<CirugiaPrevia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CirugiaPrevia | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroDiagnostico, setFiltroDiagnostico] = useState('Todos');
  const [cirugiaForm, setCirugiaForm] = useState({
    nombreProcedimiento: '', fechaCirugia: '', hospital: '', medicoCirujano: '',
    tipoAnestesia: '', complicaciones: '', observaciones: '',
  });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await pacienteExtraService.buscar(search);
        setSearchResults(res.data);
        setShowResults(res.data.length > 0);
      } catch { setSearchResults([]); } finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectPatient = async (paciente: Paciente) => {
    setSelectedPatient(paciente);
    setShowResults(false);
    setSearch(`${paciente.nombre} ${paciente.apellido}`);
    setLoading(true);
    try {
      const [perfilRes, alergiasRes, historialRes, cirugiasRes] = await Promise.all([
        pacienteExtraService.getPerfil(paciente.id!),
        pacienteExtraService.getAlergias(paciente.id!),
        consultaCompletaService.getHistorial(paciente.id!),
        cirugiaService.getByPaciente(paciente.id!),
      ]);
      setPerfil(perfilRes.data);
      setAlergias(Array.isArray(alergiasRes.data) ? alergiasRes.data : []);
      setHistorial(Array.isArray(historialRes.data) ? historialRes.data : []);
      setCirugias(Array.isArray(cirugiasRes.data) ? cirugiasRes.data : []);
    } catch { toast('error', 'Error', 'No se pudo cargar la historia clínica'); } finally { setLoading(false); }
  };

  const handleDeleteCirugia = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await cirugiaService.delete(deleteTarget.id);
      setCirugias(prev => prev.filter(x => x.id !== deleteTarget.id));
      toast('success', 'Cirugía eliminada');
      setDeleteTarget(null);
    } catch { toast('error', 'Error al eliminar'); } finally { setDeleteLoading(false); }
  };

  const sortedHistorial = [...historial]
    .filter(e => {
      if (filtroFecha) {
        const entryDate = new Date(e.fecha || e.consultaFecha || e.createdAt || 0);
        const filterDate = new Date(filtroFecha);
        if (entryDate.toDateString() !== filterDate.toDateString()) return false;
      }
      if (filtroDiagnostico !== 'Todos') {
        const diags = e.diagnosticos || [];
        const hasType = diags.some((d: any) => {
          const tipo = (d.tipo || '').toUpperCase();
          return tipo === filtroDiagnostico;
        });
        if (!hasType) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dA = new Date(a.fecha || a.consultaFecha || a.createdAt || 0).getTime();
      const dB = new Date(b.fecha || b.consultaFecha || b.createdAt || 0).getTime();
      return dB - dA;
    });

  const getValue = (obj: any, ...keys: string[]) => {
    for (const key of keys) { if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]; }
    return null;
  };

  if (!selectedPatient) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Historia Clínica</h1>
          <p className="text-sm text-gray-500 mt-1">Busque un paciente para ver su historia clínica</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre, C.I. o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
            {searchLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}
          </div>
          {showResults && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-gray-500">{p.ci}{p.telefono ? ` | ${p.telefono}` : ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
          {!searchLoading && search.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No se encontraron pacientes</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Patient header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPatient.nombre} {selectedPatient.apellido}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{selectedPatient.ci}</span>
                  {perfil?.edad && <span>{perfil.edad} años</span>}
                  {perfil?.grupoSanguineo && <span>{perfil.grupoSanguineo}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-3">
          <div className="relative max-w-xs" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cambiar paciente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value.length < 2) setShowResults(false); }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200"
            />
            {showResults && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((p) => (
                  <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-gray-500">{p.ci}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Cargando historia clínica...</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Consultas', value: perfil?.totalConsultas ?? historial.length, icon: Activity },
              { label: 'Recetas', value: perfil?.totalRecetas ?? historial.reduce((n, c) => n + ((c.recetas?.length) || 0), 0), icon: Pill },
              { label: 'Citas Pendientes', value: perfil?.citasPendientes ?? 0, icon: Calendar },
              { label: 'Última Visita', value: perfil?.ultimaConsulta ? formatDateShort(perfil.ultimaConsulta) : (sortedHistorial[0]?.fecha ? formatDateShort(sortedHistorial[0].fecha) : '-'), icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-gray-50 text-gray-400">
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-base font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Allergies */}
          <Card title="Alergias" subtitle="Alergias registradas">
            {alergias.length === 0 ? (
              <p className="text-sm text-gray-500">No se registraron alergias</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {alergias.map((alergia, idx) => {
                  const a = alergia.alergia || alergia;
                  const sev = alergia.severidad || a.severidad || 'leve';
                  return (
                    <StatusBadge key={alergia.id || idx} variant={severityToStatus(sev)} dot>
                      {a.nombre || alergia.nombre}
                    </StatusBadge>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Surgeries */}
          <Card title="Cirugías Previas" subtitle={`${cirugias.length} cirugía(s) registrada(s)`} action={
            <Button size="sm" onClick={() => { setEditingCirugia(null); setCirugiaForm({ nombreProcedimiento: '', fechaCirugia: '', hospital: '', medicoCirujano: '', tipoAnestesia: '', complicaciones: '', observaciones: '' }); setShowCirugiaModal(true); }}>
              + Agregar
            </Button>
          }>
            {cirugias.length === 0 ? (
              <p className="text-sm text-gray-500">No se registraron cirugías previas</p>
            ) : (
              <div className="space-y-2">
                {cirugias.map((c) => (
                  <div key={c.id} className="flex items-start justify-between p-3 rounded-md bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.nombreProcedimiento}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                        {c.fechaCirugia && <span>{c.fechaCirugia}</span>}
                        {c.hospital && <span>{c.hospital}</span>}
                        {c.medicoCirujano && <span>{c.medicoCirujano}</span>}
                      </div>
                      {c.complicaciones && <p className="text-xs text-red-500 mt-1">{c.complicaciones}</p>}
                    </div>
                    <div className="flex gap-1 ml-3">
                      <button onClick={() => { setEditingCirugia(c); setCirugiaForm({ nombreProcedimiento: c.nombreProcedimiento, fechaCirugia: c.fechaCirugia || '', hospital: c.hospital || '', medicoCirujano: c.medicoCirujano || '', tipoAnestesia: c.tipoAnestesia || '', complicaciones: c.complicaciones || '', observaciones: c.observaciones || '' }); setShowCirugiaModal(true); }} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Historial de Consultas</h3>
                <p className="text-sm text-gray-500 mt-0.5">{sortedHistorial.length} registro(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {(filtroFecha || filtroDiagnostico !== 'Todos') && (
                  <button
                    onClick={() => { setFiltroFecha(''); setFiltroDiagnostico('Todos'); }}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                )}
                <div className="relative">
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 outline-none"
                  />
                </div>
                <select
                  value={filtroDiagnostico}
                  onChange={(e) => setFiltroDiagnostico(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 outline-none"
                >
                  {DIAGNOSTICOS_FILTER.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5">
              {sortedHistorial.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay consultas registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedHistorial.map((entry, idx) => {
                    const fecha = getValue(entry, 'fecha', 'consultaFecha', 'createdAt');
                    const medicoNombre = getValue(entry, 'medicoNombre', 'medico?.nombre') || [entry.medico?.nombre, entry.medico?.apellido].filter(Boolean).join(' ') || '-';
                    const especialidad = getValue(entry, 'especialidad', 'medico?.especialidad?.nombre') || '-';
                    const motivo = getValue(entry, 'motivoConsulta', 'motivo') || '-';
                    const sintomas = getValue(entry, 'sintomas');
                    const temperatura = getValue(entry, 'temperatura');
                    const frecuenciaCardiaca = getValue(entry, 'frecuenciaCardiaca');
                    const presionArterial = getValue(entry, 'presionArterial');
                    const peso = getValue(entry, 'peso');
                    const saturacionOxigeno = getValue(entry, 'saturacionOxigeno');
                    const planTratamiento = getValue(entry, 'planTratamiento');
                    const observaciones = getValue(entry, 'observaciones', 'indicaciones');
                    const diagnosticos = entry.diagnosticos || [];
                    const recetas = entry.recetas || [];

                    return (
                      <div key={entry.consultaId || entry.id || idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1"><Clock className="w-3 h-3 inline mr-1" />{fecha ? formatDate(fecha) : 'Fecha no disponible'}</p>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{medicoNombre}</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">{especialidad}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Motivo</p>
                            <p className="text-sm text-gray-900">{motivo}</p>
                            {sintomas && <p className="text-sm text-gray-600 mt-1">{sintomas}</p>}
                          </div>
                          {(temperatura ?? frecuenciaCardiaca ?? presionArterial ?? peso ?? saturacionOxigeno) && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Signos Vitales</p>
                              <div className="flex flex-wrap gap-2">
                                {temperatura !== null && <span className="text-xs font-medium rounded-md px-2 py-1 bg-red-50 text-red-700"><Thermometer className="w-3 h-3 inline mr-1" />{temperatura}°C</span>}
                                {frecuenciaCardiaca !== null && <span className="text-xs font-medium rounded-md px-2 py-1 bg-pink-50 text-pink-700"><Heart className="w-3 h-3 inline mr-1" />{frecuenciaCardiaca} lpm</span>}
                                {presionArterial !== null && <span className="text-xs font-medium rounded-md px-2 py-1 bg-purple-50 text-purple-700"><Activity className="w-3 h-3 inline mr-1" />{presionArterial} mmHg</span>}
                                {saturacionOxigeno !== null && <span className="text-xs font-medium rounded-md px-2 py-1 bg-blue-50 text-blue-700"><Activity className="w-3 h-3 inline mr-1" />SpO₂ {saturacionOxigeno}%</span>}
                                {peso !== null && <span className="text-xs font-medium rounded-md px-2 py-1 bg-green-50 text-green-700"><Weight className="w-3 h-3 inline mr-1" />{peso} kg</span>}
                              </div>
                            </div>
                          )}
                          {diagnosticos.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Diagnósticos</p>
                              <ul className="space-y-1">
                                {diagnosticos.map((dx: any, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                    <div>
                                      <span className="text-gray-900">{dx.descripcion || dx.diagnostico}</span>
                                      {dx.cie10?.codigo && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-1">{dx.cie10.codigo}</span>}
                                      {dx.tipo && <span className="text-xs text-gray-500 ml-1">({dx.tipo})</span>}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {recetas.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Recetas</p>
                              {recetas.map((receta: any, i: number) => {
                                const meds = receta.items || receta.medicamentos || [];
                                return meds.map((med: any, j: number) => (
                                  <div key={`${i}-${j}`} className="flex items-center gap-2 text-sm text-gray-900">
                                    <Pill className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="font-medium">{med.medicamento?.nombre || med.nombre}</span>
                                    {med.dosis && <span className="text-gray-500">{med.dosis}</span>}
                                    {med.frecuencia && <span className="text-gray-500">c/{med.frecuencia}</span>}
                                    {med.duracion && <span className="text-gray-500">x {med.duracion}</span>}
                                  </div>
                                ));
                              })}
                            </div>
                          )}
                          {planTratamiento && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Plan de Tratamiento</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">{planTratamiento}</p>
                            </div>
                          )}
                          {observaciones && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Evolución / Notas</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">{observaciones}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/consultas', { state: { pacienteId: selectedPatient.id } })}>
              <FileText className="w-4 h-4" />Nueva Consulta
            </Button>
            <Button variant="secondary" onClick={() => setShowPerfilModal(true)}>
              <User className="w-4 h-4" />Ver Perfil Completo
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />Generar Reporte
            </Button>
          </div>
        </>
      )}

      {/* Surgery modal */}
      <Modal isOpen={showCirugiaModal} onClose={() => setShowCirugiaModal(false)} title={editingCirugia ? 'Editar Cirugía Previa' : 'Nueva Cirugía Previa'} size="md">
        <div className="space-y-4">
          <Input label="Procedimiento *" value={cirugiaForm.nombreProcedimiento} onChange={(e) => setCirugiaForm(f => ({ ...f, nombreProcedimiento: e.target.value }))} placeholder="Nombre del procedimiento" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha Cirugía" type="date" value={cirugiaForm.fechaCirugia} onChange={(e) => setCirugiaForm(f => ({ ...f, fechaCirugia: e.target.value }))} />
            <Input label="Hospital" value={cirugiaForm.hospital} onChange={(e) => setCirugiaForm(f => ({ ...f, hospital: e.target.value }))} placeholder="Nombre del hospital" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Médico Cirujano" value={cirugiaForm.medicoCirujano} onChange={(e) => setCirugiaForm(f => ({ ...f, medicoCirujano: e.target.value }))} placeholder="Nombre del cirujano" />
            <Input label="Tipo Anestesia" value={cirugiaForm.tipoAnestesia} onChange={(e) => setCirugiaForm(f => ({ ...f, tipoAnestesia: e.target.value }))} placeholder="Ej: General, Local" />
          </div>
          <Input label="Complicaciones" value={cirugiaForm.complicaciones} onChange={(e) => setCirugiaForm(f => ({ ...f, complicaciones: e.target.value }))} placeholder="Complicaciones si las hubo" />
          <Input label="Observaciones" value={cirugiaForm.observaciones} onChange={(e) => setCirugiaForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones adicionales" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCirugiaModal(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!cirugiaForm.nombreProcedimiento.trim()) return toast('warning', 'El nombre del procedimiento es obligatorio');
              try {
                const pacienteId = selectedPatient?.id;
                if (!pacienteId) { toast('error', 'Error', 'No hay paciente seleccionado'); return; }
                const payload = { ...cirugiaForm, pacienteId };
                if (editingCirugia) {
                  const res = await cirugiaService.update(editingCirugia.id!, payload);
                  setCirugias(prev => prev.map(x => x.id === editingCirugia.id ? res.data : x));
                } else {
                  const res = await cirugiaService.create(payload);
                  setCirugias(prev => [...prev, res.data]);
                }
                setShowCirugiaModal(false);
                toast('success', editingCirugia ? 'Cirugía actualizada' : 'Cirugía registrada');
              } catch { toast('error', 'Error', 'No se pudo guardar'); }
            }}>{editingCirugia ? 'Actualizar' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCirugia}
        title="Eliminar Cirugía"
        message={`¿Eliminar cirugía "${deleteTarget?.nombreProcedimiento}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />

      <Modal isOpen={showPerfilModal} onClose={() => setShowPerfilModal(false)} title="Perfil Completo del Paciente" size="lg">
        {perfil && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nombre Completo', value: perfil.nombreCompleto },
                { label: 'C.I.', value: perfil.ci },
                { label: 'Edad', value: `${perfil.edad} años` },
                { label: 'Fecha de Nacimiento', value: formatDateShort(perfil.fechaNacimiento) },
                { label: 'Género', value: perfil.genero || '-' },
                ...(perfil.grupoSanguineo ? [{ label: 'Grupo Sanguíneo', value: perfil.grupoSanguineo }] : []),
                { label: 'Teléfono', value: perfil.telefono || '-' },
                { label: 'Email', value: perfil.email || '-' },
              ].map(field => (
                <div key={field.label}>
                  <p className="text-xs text-gray-500">{field.label}</p>
                  <p className="text-sm font-medium text-gray-900">{field.value}</p>
                </div>
              ))}
            </div>
            {perfil.direccion && (
              <div>
                <p className="text-xs text-gray-500">Dirección</p>
                <p className="text-sm font-medium text-gray-900">{perfil.direccion}</p>
              </div>
            )}
            <div className="border-t border-gray-100 pt-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Consultas', value: perfil.totalConsultas },
                  { label: 'Total Recetas', value: perfil.totalRecetas },
                  { label: 'Citas Pendientes', value: perfil.citasPendientes },
                  { label: 'Registrado Desde', value: formatDateShort(perfil.registradoDesde) },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-base font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
