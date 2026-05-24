import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { OperationRequest } from '@/lib/workbook';
import { useTranslation } from '@/lib/i18n/useTranslation';

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{value}</p>
      </div>
      <button
        onClick={copy}
        className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent',
          copied ? 'text-emerald-500' : 'text-muted-foreground')}
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

interface ExecutionViewProps {
  request: OperationRequest;
}

export function ExecutionView({ request }: ExecutionViewProps) {
  const { t } = useTranslation();
  const total = request.lines.reduce((s, l) => s + l.amount, 0);

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-primary">MT5 Execution Data</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          REQ-{String(request.requestNo).padStart(3, '0')}
        </span>
      </div>

      <div className="space-y-2">
        {request.lines.map((line, i) => (
          <div key={line.id} className="space-y-2">
            {request.lines.length > 1 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Line {i + 1}</p>
            )}
            <CopyField label={t('req.field.accountNo')} value={line.accountNo} />
            <div className="grid grid-cols-2 gap-2">
              <CopyField label={t('field.amount')} value={line.amount.toString()} />
              <CopyField label={t('field.currency')} value={line.currency} />
            </div>
            {line.exchangeRate && (
              <div className="grid grid-cols-2 gap-2">
                <CopyField label={t('req.field.exchangeRate')} value={line.exchangeRate.toString()} />
                {line.receivedAmount && (
                  <CopyField label={t('req.field.receivedAmt')} value={line.receivedAmount.toString()} />
                )}
              </div>
            )}
          </div>
        ))}

        {request.lines.length > 1 && (
          <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground">Total</span>
            <span className="font-mono text-sm font-bold">${total.toLocaleString()}</span>
          </div>
        )}

        {request.note && (
          <div className="mt-2 rounded-lg border border-border/60 bg-card px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('field.note')}</p>
            <p className="text-sm">{request.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
