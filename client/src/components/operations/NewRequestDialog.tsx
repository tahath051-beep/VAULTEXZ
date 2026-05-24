import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useOperationsStore } from '@/stores/operations.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { RequestType, ExpenseSubType, RequestPriority, RequestLine } from '@/lib/workbook';

const REQUEST_TYPES: RequestType[] = [
  'deposit', 'withdrawal', 'ib_deposit', 'ib_withdrawal',
  'transfer_to', 'transfer_from', 'expense',
];

const TYPE_LABELS: Record<RequestType, { en: string; ar: string }> = {
  deposit:       { en: 'Deposit',         ar: 'تعزيز' },
  withdrawal:    { en: 'Withdrawal',       ar: 'سحب' },
  ib_deposit:    { en: 'IB Deposit',       ar: 'تعزيز ايجنت' },
  ib_withdrawal: { en: 'IB Withdrawal',    ar: 'سحب ايجنت' },
  transfer_to:   { en: 'Transfer To',      ar: 'تحويل الى' },
  transfer_from: { en: 'Transfer From',    ar: 'تحويل من' },
  expense:       { en: 'Expense',          ar: 'مصروف' },
};

const TYPE_COLORS: Record<RequestType, string> = {
  deposit:       'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  withdrawal:    'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  ib_deposit:    'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  ib_withdrawal: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  transfer_to:   'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  transfer_from: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  expense:       'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

function makeLineId() {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyLine(): RequestLine {
  return { id: makeLineId(), accountNo: '', amount: 0, currency: 'USD' };
}

interface Step1State {
  type: RequestType;
  priority: RequestPriority;
  date: string;
  note: string;
  expenseSubType: ExpenseSubType;
}

interface NewRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewRequestDialog({ open, onClose }: NewRequestDialogProps) {
  const { t, lang } = useTranslation();
  const { addRequest } = useOperationsStore();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1, setStep1] = useState<Step1State>({
    type: 'deposit',
    priority: 'normal',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    expenseSubType: 'compensation',
  });
  const [lines, setLines] = useState<RequestLine[]>([emptyLine()]);

  const isTransfer = step1.type === 'transfer_to' || step1.type === 'transfer_from';

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id: string, patch: Partial<RequestLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.accountNo && l.amount > 0);
    if (!validLines.length) return;
    addRequest({
      type: step1.type,
      expenseSubType: step1.type === 'expense' ? step1.expenseSubType : undefined,
      date: step1.date,
      priority: step1.priority,
      lines: validLines,
      createdBy: 'admin@demo.com',
      note: step1.note || undefined,
    });
    toast({ title: t('toast.requestCreated') });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setStep1({ type: 'deposit', priority: 'normal', date: new Date().toISOString().slice(0, 10), note: '', expenseSubType: 'compensation' });
    setLines([emptyLine()]);
    onClose();
  };

  const totalAmount = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('ops.requests.new')}</DialogTitle>
          <DialogDescription>
            {t('ops.requests.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
              )}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={cn('h-px w-8 transition-colors', step > s ? 'bg-emerald-500' : 'bg-border')} />}
            </div>
          ))}
          <span className="ms-2 text-xs text-muted-foreground">
            {step === 1 && 'Request type'} {step === 2 && 'Account lines'} {step === 3 && 'Review'}
          </span>
        </div>

        {/* Step 1: Type + meta */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('req.field.requestNo').replace('#', '')} type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REQUEST_TYPES.map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setStep1((s) => ({ ...s, type: rt }))}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left text-sm font-semibold transition-all',
                      step1.type === rt
                        ? TYPE_COLORS[rt] + ' ring-2 ring-offset-1 ring-current'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
                    )}
                  >
                    {lang === 'ar' ? TYPE_LABELS[rt].ar : TYPE_LABELS[rt].en}
                  </button>
                ))}
              </div>
            </div>

            {step1.type === 'expense' && (
              <div>
                <label className="mb-1 block text-xs font-medium">{t('req.field.expenseSub')}</label>
                <select
                  value={step1.expenseSubType}
                  onChange={(e) => setStep1((s) => ({ ...s, expenseSubType: e.target.value as ExpenseSubType }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="compensation">{t('req.expense.compensation')}</option>
                  <option value="gift">{t('req.expense.gift')}</option>
                  <option value="transfer_comm">{t('req.expense.transfer_comm')}</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('field.date')}</label>
                <Input
                  type="date"
                  value={step1.date}
                  onChange={(e) => setStep1((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('req.field.priority')}</label>
                <div className="flex gap-2">
                  {(['normal', 'urgent'] as RequestPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStep1((s) => ({ ...s, priority: p }))}
                      className={cn(
                        'flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors',
                        step1.priority === p
                          ? p === 'urgent'
                            ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            : 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent/40',
                      )}
                    >
                      {p === 'urgent' ? t('req.field.urgent') : t('req.field.normal')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t('field.note')}</label>
              <Input
                value={step1.note}
                onChange={(e) => setStep1((s) => ({ ...s, note: e.target.value }))}
                placeholder="Optional note…"
              />
            </div>
          </div>
        )}

        {/* Step 2: Lines */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('req.field.lines')}</p>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" /> {t('req.field.moreOptions')}
              </Button>
            </div>

            {lines.map((line, i) => (
              <div key={line.id} className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                {lines.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Line {i + 1}</span>
                    <button onClick={() => removeLine(line.id)} className="text-destructive hover:opacity-80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">{t('req.field.accountNo')} *</label>
                    <Input
                      value={line.accountNo}
                      onChange={(e) => updateLine(line.id, { accountNo: e.target.value })}
                      placeholder="12166"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">{t('field.currency')}</label>
                    <select
                      value={line.currency}
                      onChange={(e) => updateLine(line.id, { currency: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {['USD', 'TRY', 'EUR', 'LBP', 'GBP'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">{t('field.amount')} *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.amount || ''}
                    onChange={(e) => updateLine(line.id, { amount: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                {isTransfer && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('req.field.exchangeRate')}</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={line.exchangeRate ?? ''}
                        onChange={(e) => updateLine(line.id, { exchangeRate: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="45.50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('req.field.receivedAmt')}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.receivedAmount ?? ''}
                        onChange={(e) => updateLine(line.id, { receivedAmount: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {totalAmount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Total</span>
                <span className="font-mono text-sm font-bold text-primary">${totalAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{lang === 'ar' ? TYPE_LABELS[step1.type].ar : TYPE_LABELS[step1.type].en}</p>
                  <p className="text-xs text-muted-foreground">{step1.date}</p>
                </div>
                {step1.priority === 'urgent' && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {t('req.field.urgent')}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {lines.filter((l) => l.accountNo && l.amount > 0).map((line, _i) => (
                  <div key={line.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{line.accountNo}</span>
                    <div className="text-right">
                      <span className="font-semibold">${line.amount.toLocaleString()}</span>
                      <span className="ms-1 text-xs text-muted-foreground">{line.currency}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalAmount > 0 && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="font-mono text-sm font-bold">${totalAmount.toLocaleString()}</span>
                </div>
              )}

              {step1.note && (
                <p className="text-xs text-muted-foreground italic">{step1.note}</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}>
            {step === 1 ? t('action.cancel') : (
              <><ChevronLeft className="h-4 w-4 me-1" /> Back</>
            )}
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              size="sm"
              variant="gradient"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={step === 2 && !lines.some((l) => l.accountNo && l.amount > 0)}
            >
              Next <ChevronRight className="h-4 w-4 ms-1" />
            </Button>
          ) : (
            <Button type="button" size="sm" variant="gradient" onClick={handleSubmit}>
              {t('action.add')} Request
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
