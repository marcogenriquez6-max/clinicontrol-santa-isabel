import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function FormSection({ title, children, color = 'indigo', className = '' }: FormSectionProps) {
  const barColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };
  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <span className={`w-1 h-4 rounded-full ${barColors[color] || barColors.indigo}`} />
        {title}
      </h4>
      {children}
    </div>
  );
}
