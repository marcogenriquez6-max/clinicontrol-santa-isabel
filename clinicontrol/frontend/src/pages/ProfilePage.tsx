import { useEffect, useState } from 'react';
import { User, Key, Shield, Mail, Fingerprint, Calendar, Smartphone, Activity } from 'lucide-react';
import { PageHeader, Card, Button } from '../components/ui';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ci?: string;
  rol: string;
  mfaEnabled: boolean;
  bloqueado: boolean;
  ultimoLogin?: string;
  sessionCount: number;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-in-up">
        <div className="animate-pulse space-y-4">
          <div className="h-8 shimmer rounded w-1/3" />
          <div className="h-4 shimmer rounded w-2/3" />
          <div className="h-32 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-up max-w-3xl mx-auto">
      <PageHeader
        icon={User}
        gradient="from-indigo-500 to-purple-600"
        title="Mi Perfil"
        subtitle="Información personal y configuración de la cuenta"
      />

      <Card>
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
              {profile?.nombre?.charAt(0)}{profile?.apellido?.charAt(0) || ''}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {profile?.nombre} {profile?.apellido}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] capitalize">{profile?.rol}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Email</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.email}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">CI</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.ci || '—'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">MFA</span>
              </div>
              <p className={`text-sm font-medium ${profile?.mfaEnabled ? 'text-[var(--success-600)]' : 'text-[var(--text-tertiary)]'}`}>
                {profile?.mfaEnabled ? 'Activado' : 'Desactivado'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Sesiones activas</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.sessionCount || 0}</p>
            </div>
            {profile?.ultimoLogin && (
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Último acceso</span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {new Date(profile.ultimoLogin).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border-primary)] space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Configuración de la cuenta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => navigate('/perfil/cambiar-password')}>
                <Key className="w-4 h-4" /> Cambiar Contraseña
              </Button>
              <Button variant="secondary" onClick={() => navigate('/perfil/mfa')}>
                <Shield className="w-4 h-4" /> {profile?.mfaEnabled ? 'Gestionar MFA' : 'Configurar MFA'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
