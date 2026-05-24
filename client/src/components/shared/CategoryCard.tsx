import { type ReactNode } from 'react';
import { type LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryTone =
  | 'funds'
  | 'banks'
  | 'clients'
  | 'suppliers'
  | 'partners'
  | 'staff'
  | 'revenue'
  | 'expenses'
  | 'debts'
  | 'platform';

interface CategoryCardProps {
  label: string;
  arabic?: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone: CategoryTone;
  hint?: ReactNode;
  className?: string;
}

const toneMap: Record<CategoryTone, { stripe: string; iconBg: string; iconColor: string }> = {
  funds:     { stripe: 'bg-orange-400',  iconBg: 'bg-orange-50 dark:bg-orange-950/40',   iconColor: 'text-orange-500' },
  banks:     { stripe: 'bg-sky-400',     iconBg: 'bg-sky-50 dark:bg-sky-950/40',          iconColor: 'text-sky-500' },
  clients:   { stripe: 'bg-pink-400',    iconBg: 'bg-pink-50 dark:bg-pink-950/40',         iconColor: 'text-pink-500' },
  suppliers: { stripe: 'bg-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',   iconColor: 'text-emerald-500' },
  partners:  { stripe: 'bg-rose-400',    iconBg: 'bg-rose-50 dark:bg-rose-950/40',          iconColor: 'text-rose-500' },
  staff:     { stripe: 'bg-amber-400',   iconBg: 'bg-amber-50 dark:bg-amber-950/40',        iconColor: 'text-amber-500' },
  revenue:   { stripe: 'bg-violet-400',  iconBg: 'bg-violet-50 dark:bg-violet-950/40',      iconColor: 'text-violet-500' },
  expenses:  { stripe: 'bg-red-400',     iconBg: 'bg-red-50 dark:bg-red-950/40',             iconColor: 'text-red-500' },
  debts:     { stripe: 'bg-teal-400',    iconBg: 'bg-teal-50 dark:bg-teal-950/40',           iconColor: 'text-teal-500' },
  platform:  { stripe: 'bg-indigo-400',  iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',       iconColor: 'text-indigo-500' },
};

export function CategoryCard({
  label,
  arabic,
  value,
  icon: Icon,
  tone,
  hint,
  className,
}: CategoryCardProps) {
  const palette = toneMap[tone];

  return (
    <div className={cn(
      'group card-elevated relative overflow-hidden ps-6 pe-5 pt-5 pb-5',
      'transition-all duration-200 ease-spring hover:-translate-y-1 hover:shadow-shadow-3',
      className,
    )}>
      {/* Left accent bar */}
      <div className={cn('absolute inset-y-0 start-0 w-[3px] rounded-e', palette.stripe)} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {arabic && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70" dir="rtl">
              {arabic}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            'transition-transform duration-200 group-hover:scale-110',
            palette.iconBg,
          )}>
            <Icon className={cn('h-4 w-4', palette.iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-4 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </div>

      {hint && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors duration-150">
          {hint}
          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
        </p>
      )}
    </div>
  );
}
