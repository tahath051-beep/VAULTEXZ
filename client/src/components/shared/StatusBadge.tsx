import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n/useTranslation';

const statusMap: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  PENDING:   'warning',
  APPROVED:  'success',
  REJECTED:  'destructive',
  ACTIVE:    'success',
  INACTIVE:  'secondary',
  POSTED:    'success',
  DRAFT:     'secondary',
  LOCKED:    'default',
  COMPLETED: 'success',
  FAILED:    'destructive',
  RUNNING:   'warning',
  PAID:      'success',
  true:      'success',
  false:     'secondary',
};

const statusKeyMap: Record<string, string> = {
  PENDING:   'status.pending',
  APPROVED:  'status.approved',
  REJECTED:  'status.rejected',
  ACTIVE:    'status.active',
  INACTIVE:  'status.inactive',
  POSTED:    'status.posted',
  DRAFT:     'status.draft',
  LOCKED:    'status.locked',
  COMPLETED: 'status.completed',
  FAILED:    'status.failed',
  RUNNING:   'status.running',
  PAID:      'status.paid',
};

export function StatusBadge({ status }: { status: string | boolean }) {
  const { t } = useTranslation();
  const key     = String(status).toUpperCase();
  const variant = statusMap[key] ?? 'outline';
  const i18nKey = statusKeyMap[key];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label   = i18nKey ? t(i18nKey as any) : String(status);
  return <Badge variant={variant}>{label}</Badge>;
}
