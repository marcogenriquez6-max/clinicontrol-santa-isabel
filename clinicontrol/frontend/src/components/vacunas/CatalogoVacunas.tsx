import { Search, Pencil, Trash2, Syringe } from 'lucide-react';
import { Button, Card } from '../ui';
import type { Vacuna } from '../../types';

interface CatalogoVacunasProps {
  vacunas: Vacuna[];
  searchCatalog: string;
  loading: boolean;
  onSearchChange: (s: string) => void;
  onEdit: (vacuna: Vacuna) => void;
  onDelete: (id: number, name: string) => void;
  onNueva: () => void;
}

export default function CatalogoVacunas({
  vacunas,
  searchCatalog,
  onSearchChange,
  onEdit,
  onDelete,
  onNueva,
}: CatalogoVacunasProps) {
  const filteredVacunas = vacunas.filter(v =>
    v.nombre.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  return (
    <Card
      title="Catálogo de Vacunas"
      subtitle={`${vacunas.length} vacunas registradas`}
      accent="primary"
      action={
        <Button variant="premium" onClick={onNueva}>
          <Syringe className="w-4 h-4 mr-2" />Nueva Vacuna
        </Button>
      }
    >
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Buscar vacuna..."
            value={searchCatalog}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3.5 py-2.5 bg-[var(--bg-primary)] border-2 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-primary)] focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] outline-none transition-all duration-200 w-full max-w-md pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-premium">
          <thead className="bg-[var(--bg-secondary)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Dosis</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Edad</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Obligatoria</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {filteredVacunas.map((vacuna) => (
              <tr key={vacuna.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{vacuna.nombre}</td>
                <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{vacuna.dosisRecomendadas}</td>
                <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                  {vacuna.edadMinimaMeses != null
                    ? `${vacuna.edadMinimaMeses} - ${vacuna.edadMaximaMeses ?? '∞'} meses`
                    : 'Sin especificar'}
                </td>
                <td className="px-6 py-4 text-center">
                  {vacuna.esObligatoria
                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--danger-100)] text-[var(--danger-700)]">Sí</span>
                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">No</span>
                  }
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" icon onClick={() => onEdit(vacuna)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" icon onClick={() => onDelete(vacuna.id!, vacuna.nombre)}>
                      <Trash2 className="w-4 h-4 text-[var(--danger-500)]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
