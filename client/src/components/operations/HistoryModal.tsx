import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { OP_STATUS_COLORS, OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN, type OpRequest } from '@/stores/opModule.store';

interface Props { request: OpRequest; onClose: () => void; }

export function HistoryModal({ request, onClose }: Props) {
  const { t, lang } = useTranslation();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('opmod.history.title')} — <span className="font-mono text-primary">{request.request_number}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-semibold">{lang === 'ar' ? OP_TYPE_LABEL_AR[request.request_type] : OP_TYPE_LABEL_EN[request.request_type]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', OP_STATUS_COLORS[request.status])}>
                {t(`opmod.status.${request.status}` as any)}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold tabular-nums">{request.request_date}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount (USD)</p>
              <p className="font-mono font-semibold">${request.total_amount_usd.toLocaleString()}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative space-y-3 ps-5">
            <div className="absolute start-2 top-2 bottom-2 w-px bg-border" />
            {request.workflow.map((step) => (
              <div key={step.id} className="relative">
                <div className={cn('absolute -start-3.5 top-1 h-3 w-3 rounded-full border-2 border-background',
                  step.action === 'rejected' || step.action === 'trashed' ? 'bg-destructive' :
                  step.action === 'advanced' ? 'bg-primary' : 'bg-muted-foreground')} />
                <div className="rounded-lg border border-border/50 bg-card p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">
                      {step.action === 'created' ? t('opmod.history.created') :
                       step.action === 'advanced' ? `${t('opmod.history.advanced')} → ${t(`opmod.status.${step.to_status}` as any)}` :
                       step.action === 'rejected' ? t('opmod.history.rejected') :
                       t('opmod.history.trashed')}
                    </p>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(step.performed_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.performed_by}</p>
                  {step.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{step.notes}"</p>}
                </div>
              </div>
            ))}
          </div>

          {request.journal_entry_ref && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs dark:border-emerald-800 dark:bg-emerald-950/30">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                📒 Journal Entry: {request.journal_entry_ref}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
