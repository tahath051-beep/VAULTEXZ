import { X, CheckCircle, PlayCircle, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperationRequest } from '@/lib/workbook';
import { useOperationsStore } from '@/stores/operations.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RequestTypeBadge } from './RequestTypeBadge';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestTimeline } from './RequestTimeline';
import { ExecutionView } from './ExecutionView';

interface RequestDetailSheetProps {
  request: OperationRequest | null;
  onClose: () => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function RequestDetailSheet({ request, onClose }: RequestDetailSheetProps) {
  const { t } = useTranslation();
  const { confirmRequest, executeRequest, createVoucher } = useOperationsStore();
  const { toast } = useToast();

  if (!request) return null;

  const reqLabel = `REQ-${String(request.requestNo).padStart(3, '0')}`;
  const total = request.lines.reduce((s, l) => s + l.amount, 0);

  const handleConfirm = () => {
    confirmRequest(request.id, 'admin@demo.com');
    toast({ title: t('toast.requestConfirmed') });
  };
  const handleExecute = () => {
    executeRequest(request.id, 'admin@demo.com');
    toast({ title: t('toast.requestExecuted') });
  };
  const handleVoucher = () => {
    createVoucher(request.id);
    toast({ title: t('toast.voucherGenerated') });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={cn(
        'fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl transition-transform',
        'border-s border-border',
      )}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-lg font-bold">{reqLabel}</span>
              {request.priority === 'urgent' && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  <AlertTriangle className="h-3 w-3" /> {t('req.field.urgent')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <RequestTypeBadge type={request.type} />
              <RequestStatusBadge status={request.status} />
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-5">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('field.date')}</p>
                <p className="font-semibold">{formatDate(request.date)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-mono font-bold">${total.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('req.field.createdBy')}</p>
                <p className="truncate text-xs">{request.createdBy}</p>
              </div>
              {request.voucherRef && (
                <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Voucher ref</p>
                  <p className="font-mono text-xs font-semibold text-primary">{request.voucherRef}</p>
                </div>
              )}
            </div>

            {/* Lines */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('req.field.lines')}</p>
              <div className="space-y-2">
                {request.lines.map((line) => (
                  <div key={line.id} className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-muted-foreground">{line.accountNo}</span>
                      <div className="text-right">
                        <span className="font-bold">${line.amount.toLocaleString()}</span>
                        <span className="ms-1 text-xs text-muted-foreground">{line.currency}</span>
                      </div>
                    </div>
                    {line.accountName && <p className="mt-0.5 text-xs text-muted-foreground">{line.accountName}</p>}
                    {line.exchangeRate && (
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{t('req.field.exchangeRate')}: <strong>{line.exchangeRate}</strong></span>
                        {line.receivedAmount && <span>{t('req.field.receivedAmt')}: <strong>{line.receivedAmount.toLocaleString()}</strong></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            {request.note && (
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('field.note')}</p>
                <p className="text-sm">{request.note}</p>
              </div>
            )}

            {/* MT5 Execution helper */}
            {(request.status === 'confirmed' || request.status === 'executed') && (
              <ExecutionView request={request} />
            )}

            {/* Timeline */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
              <RequestTimeline events={request.timeline} />
            </div>
          </div>
        </div>

        {/* Actions footer */}
        {request.status !== 'voucher' && (
          <div className="border-t border-border p-4">
            {request.status === 'pending' && (
              <Button onClick={handleConfirm} className="w-full gap-2" variant="gradient">
                <CheckCircle className="h-4 w-4" />
                {t('req.status.confirmed')}
              </Button>
            )}
            {request.status === 'confirmed' && (
              <Button onClick={handleExecute} className="w-full gap-2" variant="gradient">
                <PlayCircle className="h-4 w-4" />
                {t('req.status.executed')}
              </Button>
            )}
            {request.status === 'executed' && (
              <Button onClick={handleVoucher} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <FileText className="h-4 w-4" />
                {t('req.status.voucher')}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
