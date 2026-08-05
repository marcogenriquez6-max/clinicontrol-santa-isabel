import { useNavigate } from 'react-router-dom';
import {
  LogOut, Moon, Sun, Search, Bell, Menu,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { pacienteService, medicoService } from '../../api/services';

interface SearchResult {
  type: 'paciente' | 'medico';
  id: number;
  label: string;
  sublabel: string;
}

interface TopNavProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function TopNav({ sidebarOpen, onToggleSidebar }: TopNavProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = (term: string) => {
    if (term.length < 2) { setResults([]); setShowResults(false); return; }
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          pacienteService.getAll().catch(() => ({ data: [] })),
          medicoService.getAll().catch(() => ({ data: [] })),
        ]);
        const pArr = Array.isArray(pRes.data) ? pRes.data : [];
        const mArr = Array.isArray(mRes.data) ? mRes.data : [];
        const t = term.toLowerCase();
        const found: SearchResult[] = [];
        pArr.forEach((p: { id?: number; nombre?: string; apellido?: string; ci?: string }) => {
          const name = `${p.nombre ?? ''} ${p.apellido ?? ''}`.toLowerCase();
          if (name.includes(t) || (p.ci ?? '').includes(t)) {
            found.push({ type: 'paciente', id: p.id ?? 0, label: `${p.nombre ?? ''} ${p.apellido ?? ''}`, sublabel: `CI: ${p.ci ?? ''}` });
          }
        });
        mArr.forEach((m: { id?: number; nombre?: string; apellido?: string; numColegiado?: string }) => {
          const name = `${m.nombre ?? ''} ${m.apellido ?? ''}`.toLowerCase();
          if (name.includes(t) || (m.numColegiado ?? '').includes(t)) {
            found.push({ type: 'medico', id: m.id ?? 0, label: `Dr. ${m.nombre ?? ''} ${m.apellido ?? ''}`, sublabel: `Colegiado: ${m.numColegiado ?? ''}` });
          }
        });
        setResults(found.slice(0, 8));
        setShowResults(true);
      } catch { setResults([]); }
    })();
  };

  const onSearchChange = (v: string) => {
    setSearchTerm(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 300);
  };

  const handleResultClick = (r: SearchResult) => {
    setShowResults(false);
    setSearchTerm('');
    if (r.type === 'paciente') navigate(`/historia-clinica?pacienteId=${r.id}`);
    else navigate(`/medicos`);
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 border-b transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        left: sidebarOpen ? '16rem' : '0',
      }}
    >
      <div className="flex items-center h-14 px-6">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div ref={searchContainerRef} className={`relative flex items-center flex-1 max-w-md ${searchOpen ? 'block' : 'hidden md:flex'}`}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar pacientes, médicos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchTerm.length >= 2 && results.length > 0 && setShowResults(true)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg transition-colors outline-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleResultClick(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-500)' }}>
                    {r.type === 'paciente' ? 'P' : 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.sublabel}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                    {r.type === 'paciente' ? 'Paciente' : 'Médico'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            className="relative p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3 pl-3 ml-2 border-l" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: 'var(--primary-500)', color: '#fff' }}
              >
                {user?.nombre?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.nombre || 'Usuario'}
              </span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
