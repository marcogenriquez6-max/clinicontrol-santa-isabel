import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  padding?: boolean;
  hover?: boolean;
  gradient?: boolean;
  glow?: boolean;
  accent?: 'primary' | 'success' | 'danger' | 'warning' | 'accent' | 'fuchsia' | 'rose';
}

const accentStyles: Record<string, string> = {
  primary: 'border-l-2 border-l-[var(--primary-600)]',
  success: 'border-l-2 border-l-[var(--success-500)]',
  danger: 'border-l-2 border-l-[var(--danger-500)]',
  warning: 'border-l-2 border-l-[var(--warning-500)]',
  accent: 'border-l-2 border-l-[var(--info-500)]',
};

export default function Card({ children, className = '', title, subtitle, action, padding = true, hover = false, accent }: Omit<CardProps, 'glow'>) {
  return (
    <div
      className={`
        bg-[var(--bg-card)] rounded-md border border-[var(--border-primary)]
        ${hover ? 'hover:border-[var(--neutral-300)] transition-colors' : ''}
        ${accent ? accentStyles[accent] || '' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-secondary)]">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>
        {children}
      </div>
    </div>
  );
}
