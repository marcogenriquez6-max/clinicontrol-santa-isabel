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
  primary: 'border-l-4 border-l-blue-500',
  success: 'border-l-4 border-l-green-500',
  danger: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-amber-500',
  accent: 'border-l-4 border-l-violet-500',
  fuchsia: 'border-l-4 border-l-fuchsia-500',
  rose: 'border-l-4 border-l-rose-500',
};

const gradientStyles: Record<string, string> = {
  primary: 'bg-gradient-to-br from-blue-50 to-white',
  success: 'bg-gradient-to-br from-green-50 to-white',
  danger: 'bg-gradient-to-br from-red-50 to-white',
  warning: 'bg-gradient-to-br from-amber-50 to-white',
  accent: 'bg-gradient-to-br from-violet-50 to-white',
  fuchsia: 'bg-gradient-to-br from-fuchsia-50 to-white',
  rose: 'bg-gradient-to-br from-rose-50 to-white',
};

export default function Card({ children, className = '', title, subtitle, action, padding = true, hover = false, gradient, glow, accent }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-shadow' : ''}
        ${gradient && accent ? gradientStyles[accent] || '' : ''}
        ${accent && !gradient ? accentStyles[accent] || '' : ''}
        ${glow ? 'shadow-lg shadow-blue-100/50' : ''}
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
