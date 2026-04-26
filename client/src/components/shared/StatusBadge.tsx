import { Badge } from '@/components/ui/badge';

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

export function StatusBadge({ status }: { status: string | boolean }) {
  const key = String(status).toUpperCase();
  const variant = statusMap[key] ?? 'outline';
  return <Badge variant={variant}>{String(status)}</Badge>;
}
