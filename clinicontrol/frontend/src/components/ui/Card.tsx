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
        bg-white rounded-md border border-gray-200
        ${hover ? 'hover:border-gray-300 transition-colors' : ''}
        ${accent ? accentStyles[accent] || '' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
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
