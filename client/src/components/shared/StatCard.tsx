import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  accent?: 'blue' | 'green' | 'amber' | 'pink' | 'violet';
  className?: string;
  onClick?: () => void;
}

const accentMap = {
  blue: {
    bg: 'bg-primary/10', icon: 'text-primary',
    orb: 'bg-primary/20',
    glow: 'group-hover:shadow-[0_4px_20px_hsl(var(--primary)/0.18)]',
  },
  green: {
    bg: 'bg-success/10', icon: 'text-success',
    orb: 'bg-success/20',
    glow: 'group-hover:shadow-[0_4px_20px_hsl(var(--success)/0.18)]',
  },
  amber: {
    bg: 'bg-warning/10', icon: 'text-warning',
    orb: 'bg-warning/20',
    glow: 'group-hover:shadow-[0_4px_20px_hsl(var(--warning)/0.18)]',
  },
  pink: {
    bg: 'bg-destructive/10', icon: 'text-destructive',
    orb: 'bg-destructive/20',
    glow: 'group-hover:shadow-[0_4px_20px_hsl(var(--destructive)/0.18)]',
  },
  violet: {
    bg: 'bg-violet-500/10', icon: 'text-violet-500',
    orb: 'bg-violet-500/20',
    glow: 'group-hover:shadow-[0_4px_20px_rgba(139,92,246,0.18)]',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = 'vs last period',
  accent = 'blue',
  className,
  onClick,
}: StatCardProps) {
  const palette = accentMap[accent];
  const positive = delta != null && delta >= 0;

  return (
    <div
      className={cn(
        'group card-elevated relative overflow-hidden p-6',
        'transition-all duration-200 ease-spring',
        'hover:-translate-y-1 hover:shadow-shadow-3',
        palette.glow,
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground leading-snug">{label}</p>
        {Icon && (
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            'transition-transform duration-200 group-hover:scale-110',
            palette.bg,
          )}>
            <Icon className={cn('h-[18px] w-[18px]', palette.icon)} />
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums animate-count-up">
          {value}
        </p>
        {delta != null && (
          <span className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0',
            positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive',
          )}>
            {positive
              ? <ArrowUpRight className="h-3 w-3" />
              : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[11px] text-muted-foreground/70">{deltaLabel}</p>

      {/* Decorative hover orb */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full blur-2xl',
          'opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          palette.orb,
        )}
      />
    </div>
  );
}
