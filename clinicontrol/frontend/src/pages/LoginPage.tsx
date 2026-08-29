import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Logo, toast } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, HeartPulse } from 'lucide-react';
import { errMsg } from '../api/errMsg';
import { isAxiosError } from 'axios';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const CREDENCIALES_INVALIDAS =
  'Credenciales inválidas. Verifique su email y contraseña.';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ defaultValues: { remember: false } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password, data.remember);
      toast('success', 'Bienvenido');
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      // El backend responde 401 ante credenciales incorrectas; para ese caso
      // el mensaje es el fijado por la especificación. Cualquier otro fallo
      // (red, 5xx) muestra el mensaje que devuelva el backend vía errMsg.
      const msg =
        isAxiosError(err) && err.response?.status === 401
          ? CREDENCIALES_INVALIDAS
          : errMsg(err, CREDENCIALES_INVALIDAS);
      setError(msg);
      toast('error', 'No se pudo iniciar sesión', msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      <div className="w-full flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Clínica Santa Isabel
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sistema de Gestión Hospitalaria
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Ingrese sus credenciales para acceder al sistema
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3 bg-[var(--danger-50)] border border-[var(--danger-200)] rounded-lg flex items-start gap-2 text-sm text-[var(--danger-700)]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...register('email', {
                  required: 'Ingrese un email válido',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingrese un email válido',
                  },
                })}
              />

              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register('password', {
                  required: 'Mínimo 6 caracteres',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--primary-600)] focus:ring-2 focus:ring-[var(--primary-100)]"
                    {...register('remember')}
                  />
                  <span className="text-[var(--text-secondary)]">Recordar sesión</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[var(--primary-600)] hover:underline"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="primary"
                size="lg"
                loading={loading}
              >
                <HeartPulse className="w-4 h-4" />
                Ingresar al sistema
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
            &copy; 2026 Clínica Santa Isabel &mdash; Versión 2.0
          </p>
        </div>
      </div>
    </div>
  );
}
