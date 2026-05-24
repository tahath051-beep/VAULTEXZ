import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-slide-up',
      className,
    )}>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl leading-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
