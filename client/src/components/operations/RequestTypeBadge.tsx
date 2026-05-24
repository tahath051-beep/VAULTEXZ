import { cn } from '@/lib/utils';
import type { RequestType } from '@/lib/workbook';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

const typeConfig: Record<RequestType, { color: string; labelKey: TranslationKey }> = {
  deposit:       { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', labelKey: 'req.type.deposit' },
  withdrawal:    { color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',         labelKey: 'req.type.withdrawal' },
  ib_withdrawal: { color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',     labelKey: 'req.type.ib_withdrawal' },
  ib_deposit:    { color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',                 labelKey: 'req.type.ib_deposit' },
  transfer_to:   { color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',     labelKey: 'req.type.transfer_to' },
  transfer_from: { color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',     labelKey: 'req.type.transfer_from' },
  expense:       { color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',                 labelKey: 'req.type.expense' },
};

interface RequestTypeBadgeProps {
  type: RequestType;
  size?: 'sm' | 'xs';
  className?: string;
}

export function RequestTypeBadge({ type, size = 'sm', className }: RequestTypeBadgeProps) {
  const { t } = useTranslation();
  const cfg = typeConfig[type];
  return (
    <span className={cn(
      'inline-block rounded-full font-semibold',
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
      cfg.color,
      className,
    )}>
      {t(cfg.labelKey)}
    </span>
  );
}

export function getTypeColor(type: RequestType): string {
  return typeConfig[type]?.color ?? 'bg-muted text-muted-foreground';
}
