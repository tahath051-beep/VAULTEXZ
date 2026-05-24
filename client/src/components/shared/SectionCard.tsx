import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  variant?: 'default' | 'glass' | 'flat';
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
  variant = 'default',
}: SectionCardProps) {
  const hasHeader = title || description || action;

  const wrapperClass = {
    default: 'card-elevated',
    glass:   'card-glass',
    flat:    'rounded-2xl border border-border/50 bg-transparent',
  }[variant];

  return (
    <section className={cn(wrapperClass, 'overflow-hidden', className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 px-6 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(padded && 'p-6', bodyClassName)}>{children}</div>
    </section>
  );
}
