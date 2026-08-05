import { User, Plus, Trash2, Syringe, Calendar } from 'lucide-react';
import { Button, Card } from '../ui';
import { estadoBadge, estadoIcon } from './constants';
import type { Paciente, PacienteVacuna, CalendarioVacuna, Vacuna } from '../../types';

interface PacienteSectionProps {
  pacientes: Paciente[];
  patientVacunas: PacienteVacuna[];
  calendario: CalendarioVacuna[];
  vacunas: Vacuna[];
  selectedPatient: Paciente | null;
  searchPatient: string;
  viewType: 'record' | 'calendar';
  onSelectPatient: (p: Paciente) => void;
  onSearchChange: (s: string) => void;
  onViewTypeChange: (t: 'record' | 'calendar') => void;
  onAplicar: (vacuna?: Vacuna) => void;
  onDeleteAplicacion: (id: number) => void;
}

export default function PacienteSection({
  pacientes,
  patientVacunas,
  calendario,
  selectedPatient,
  searchPatient,
  viewType,
  onSelectPatient,
  onSearchChange,
  onViewTypeChange,
  onAplicar,
  onDeleteAplicacion,
}: PacienteSectionProps) {
  const filteredPacientes = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.ci}`.toLowerCase().includes(searchPatient.toLowerCase())
  );

  return (
    <Card title="Vacunas del Paciente" subtitle="Gestionar vacunación por paciente" accent="accent">
      <div className="mb-4 relative">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Buscar paciente por nombre o CI..."
            value={searchPatient}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-full max-w-md pl-10"
          />
        </div>
        {searchPatient && (
          <div className="absolute z-10 mt-1 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-lg)] max-h-60 overflow-y-auto">
            {filteredPacientes.map((p) => (
              <button
                key={p.id}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] flex items-center gap-2 transition-colors"
                onClick={() => onSelectPatient(p)}
              >
                <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="font-medium text-[var(--text-primary)]">{p.nombre} {p.apellido}</span>
                <span className="text-[var(--text-tertiary)]">- {p.ci}</span>
              </button>
            ))}
            {filteredPacientes.length === 0 && (
              <p className="px-4 py-2 text-sm text-[var(--text-tertiary)]">No se encontraron pacientes</p>
            )}
          </div>
        )}
      </div>

      {selectedPatient && (
        <>
          <div className="flex items-center justify-between mb-4 p-4 bg-[var(--primary-50)] rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[var(--primary-600)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{selectedPatient.nombre} {selectedPatient.apellido}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{selectedPatient.ci}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewType === 'record' ? 'primary' : 'outline'}
                onClick={() => onViewTypeChange('record')}
              >
                Historial
              </Button>
              <Button
                size="sm"
                variant={viewType === 'calendar' ? 'primary' : 'outline'}
                onClick={() => onViewTypeChange('calendar')}
              >
                <Calendar className="w-4 h-4 mr-1" />Calendario
              </Button>
            </div>
          </div>

          {viewType === 'record' && (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="premium" size="sm" onClick={() => onAplicar()}><Plus className="w-4 h-4 mr-1" />Aplicar Vacuna</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-premium">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Vacuna</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Dosis</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Lote</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Próxima Dosis</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {patientVacunas.map((pv) => (
                      <tr key={pv.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{pv.vacuna?.nombre || `ID: ${pv.vacunaId}`}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{pv.dosisNumero}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{pv.fechaAplicacion}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{pv.lote || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{pv.proximaDosis || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" icon onClick={() => onDeleteAplicacion(pv.id)}>
                            <Trash2 className="w-4 h-4 text-[var(--danger-500)]" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {patientVacunas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--text-tertiary)]">
                          Este paciente no tiene vacunas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {viewType === 'calendar' && (
            <div className="overflow-x-auto">
              <table className="w-full table-premium">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Vacuna</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Dosis Recomendadas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Dosis Aplicadas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {calendario.map((item) => {
                    const Icon = estadoIcon(item.estado);
                    return (
                      <tr key={item.vacuna.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{item.vacuna.nombre}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.vacuna.dosisRecomendadas}</td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.dosisAplicadas}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge(item.estado)}`}>
                            <Icon className="w-3 h-3" />
                            {item.estado === 'completa' ? 'Completa' :
                             item.estado === 'incompleta' ? 'Incompleta' :
                             item.estado === 'pendiente' ? 'Pendiente' :
                             item.estado === 'atrasada' ? 'Atrasada' : 'No corresponde'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.estado !== 'completa' && item.estado !== 'no_corresponde' && (
                            <Button variant="premium" size="sm" onClick={() => onAplicar(item.vacuna)}>
                              <Syringe className="w-4 h-4 mr-1" />Aplicar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {calendario.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-[var(--text-tertiary)]">
                        No hay vacunas recomendadas disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
