import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/lib/workbook';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

const statusConfig: Record<RequestStatus, { color: string; labelKey: TranslationKey; dot: string }> = {
  pending:   { color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',       dot: 'bg-amber-500',   labelKey: 'req.status.pending' },
  confirmed: { color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',           dot: 'bg-blue-500',    labelKey: 'req.status.confirmed' },
  executed:  { color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',   dot: 'bg-violet-500',  labelKey: 'req.status.executed' },
  voucher:   { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', dot: 'bg-emerald-500', labelKey: 'req.status.voucher' },
};

export function RequestStatusBadge({ status, size = 'sm' }: { status: RequestStatus; size?: 'sm' | 'xs' }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-semibold',
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
      cfg.color,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {t(cfg.labelKey)}
    </span>
  );
}
