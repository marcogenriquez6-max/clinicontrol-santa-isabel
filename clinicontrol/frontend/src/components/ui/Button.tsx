import { forwardRef, useState, useCallback, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, icon, fullWidth, children, disabled, ...props }, ref) => {
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipple(null), 600);
      props.onClick?.(e);
    }, [props.onClick]);

    const base = 'btn-premium relative overflow-hidden inline-flex items-center justify-center font-medium transition-[transform,box-shadow,opacity,color,background-color,border-color] duration-200 active:scale-[0.97] select-none';
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
      md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
      lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
    };
    const variants = {
      primary: 'bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-700)] text-white shadow-lg shadow-[var(--primary-500)]/20 hover:shadow-[var(--primary-500)]/30 hover:from-[var(--primary-700)] hover:to-[var(--primary-800)] hover:-translate-y-0.5 active:from-[var(--primary-800)] active:to-[var(--primary-900)] active:-translate-y-0',
      secondary: 'bg-[var(--bg-card)] text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[var(--neutral-300)] hover:bg-[var(--bg-tertiary)] hover:-translate-y-0.5 active:bg-[var(--border-primary)] active:-translate-y-0 shadow-sm',
      danger: 'bg-gradient-to-r from-[var(--danger-500)] to-[var(--danger-600)] text-white shadow-lg shadow-[var(--danger-500)]/20 hover:shadow-[var(--danger-500)]/30 hover:from-[var(--danger-600)] hover:to-[var(--danger-700)] hover:-translate-y-0.5 active:from-[var(--danger-700)] active:to-[var(--danger-800)] active:-translate-y-0',
      success: 'bg-gradient-to-r from-[var(--success-500)] to-[var(--success-600)] text-white shadow-lg shadow-[var(--success-500)]/20 hover:shadow-[var(--success-500)]/30 hover:from-[var(--success-600)] hover:to-[var(--success-700)] hover:-translate-y-0.5 active:from-[var(--success-700)] active:to-[var(--success-800)] active:-translate-y-0',
      ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:bg-[var(--border-primary)]',
      outline: 'border-2 border-[var(--primary-200)] text-[var(--primary-700)] hover:bg-[var(--primary-50)] hover:border-[var(--primary-300)] hover:-translate-y-0.5 active:bg-[var(--primary-100)] active:-translate-y-0',
      premium: 'relative bg-gradient-to-r from-[var(--primary-500)] via-[var(--accent-500)] to-[var(--fuchsia-500)] bg-[length:200%_100%] text-white shadow-lg shadow-[var(--primary-500)]/20 hover:shadow-[var(--primary-500)]/40 hover:bg-[length:100%_100%] hover:-translate-y-0.5 active:-translate-y-0',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${icon ? '!p-2.5' : ''} ${fullWidth ? 'w-full' : ''} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 ${className}`}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading && <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />}
        {!loading && children}
        {ripple && (
          <span
            className="absolute rounded-full bg-white/30 animate-[ripple_0.6s_ease-out] pointer-events-none"
            style={{ left: ripple.x - 8, top: ripple.y - 8, width: 16, height: 16 }}
          />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
