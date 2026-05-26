import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import {
  useOpModuleStore, MOCK_ACCOUNTS,
  resolveCounterAccount, isAgentAccount,
  OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN,
  type OpType, type OpLine,
} from '@/stores/opModule.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ALL_TYPES: OpType[] = ['deposit', 'withdrawal', 'agent_deposit', 'agent_withdrawal', 'transfer_from', 'transfer_to', 'expense'];

const TYPE_COLORS: Record<OpType, string> = {
  deposit:          'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700',
  withdrawal:       'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700',
  agent_deposit:    'border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-700',
  agent_withdrawal: 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700',
  transfer_from:    'border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700',
  transfer_to:      'border-indigo-400 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-700',
  expense:          'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700',
};

interface LineForm {
  tempId: string;
  mt5_account_number: string;
  account_id: string;
  currency: string;
  amount_in_currency: string;
  exchange_rate: string;
  payment_method_id: string;
}

function emptyLine(): LineForm {
  return { tempId: `tmp-${Date.now()}`, mt5_account_number: '', account_id: '', currency: 'USD', amount_in_currency: '', exchange_rate: '1', payment_method_id: '' };
}

interface Props { open: boolean; onClose: () => void; }

export function NewOpRequestModal({ open, onClose }: Props) {
  const { t, lang } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { createRequest, paymentMethods, settings, getTodayRate } = useOpModuleStore();
  const { toast } = useToast();

  const [requestType, setRequestType] = useState<OpType>('deposit');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes2, setNotes2] = useState('');
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setRequestType('deposit');
      setRequestDate(new Date().toISOString().slice(0, 10));
      setNotes2('');
      setLines([emptyLine()]);
      setErrors([]);
    }
  }, [open]);

  const updateLine = (tempId: string, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l) => {
      if (l.tempId !== tempId) return l;
      const updated = { ...l, ...patch };
      // Auto-update exchange rate when currency changes
      if (patch.currency) {
        const rate = getTodayRate(patch.currency);
        updated.exchange_rate = String(rate);
      }
      return updated;
    }));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (tempId: string) => setLines((prev) => prev.filter((l) => l.tempId !== tempId));

  const getCounterAccount = (mt5: string) => resolveCounterAccount(mt5, settings);
  const isAgent = (mt5: string) => isAgentAccount(mt5, settings);

  const totalUsd = lines.reduce((s, l) => {
    const amt = parseFloat(l.amount_in_currency) || 0;
    const rate = parseFloat(l.exchange_rate) || 1;
    return s + amt * rate;
  }, 0);

  const handleSubmit = () => {
    const errs: string[] = [];
    if (!requestDate) errs.push('Request date is required');
    lines.forEach((l, i) => {
      if (!l.mt5_account_number) errs.push(`Line ${i + 1}: MT5 account required`);
      if (!l.account_id) errs.push(`Line ${i + 1}: Source/destination account required`);
      if (!l.amount_in_currency || parseFloat(l.amount_in_currency) <= 0) errs.push(`Line ${i + 1}: Amount must be > 0`);
    });
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const firstMt5 = lines[0]?.mt5_account_number ?? '';
    const typeAr = lang === 'ar' ? OP_TYPE_LABEL_AR[requestType] : OP_TYPE_LABEL_EN[requestType];
    const notes1 = `${typeAr} - Account ${firstMt5}`;

    const opLines: Omit<OpLine, 'id'>[] = lines.map((l, i) => {
      const counter = getCounterAccount(l.mt5_account_number);
      const sourceAcc = MOCK_ACCOUNTS.find((a) => a.id === l.account_id);
      const amt = parseFloat(l.amount_in_currency) || 0;
      const rate = parseFloat(l.exchange_rate) || 1;
      const pm = paymentMethods.find((p) => p.id === l.payment_method_id);
      return {
        line_number: i + 1,
        mt5_account_number: l.mt5_account_number,
        account_id: l.account_id,
        account_name: sourceAcc?.name ?? l.account_id,
        counter_account_id: counter.id,
        counter_account_name: lang === 'ar' ? counter.name_ar : counter.name,
        currency: l.currency,
        amount_in_currency: amt,
        exchange_rate: rate,
        amount_usd: amt * rate,
        payment_method_id: pm?.id,
      };
    });

    createRequest({
      request_type: requestType,
      source: 'manual',
      created_by: user?.full_name ?? 'موظف الطلبات',
      request_date: requestDate,
      notes_1: notes1,
      notes_2: notes2 || undefined,
      total_amount_usd: totalUsd,
      lines: opLines as OpLine[],
    });

    toast({ title: t('opmod.toast.created') });
    onClose();
  };

  const activeMethods = paymentMethods.filter((p) => p.is_active);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('opmod.action.newRequest')}</DialogTitle>
          <DialogDescription>{t('opmod.requests.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Request type */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('opmod.field.requestType')}
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {ALL_TYPES.map((rt) => (
                <button
                  key={rt} type="button"
                  onClick={() => setRequestType(rt)}
                  className={cn(
                    'rounded-xl border-2 p-2.5 text-center text-xs font-semibold transition-all',
                    requestType === rt ? TYPE_COLORS[rt] + ' ring-2 ring-current ring-offset-1' : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  {lang === 'ar' ? OP_TYPE_LABEL_AR[rt] : OP_TYPE_LABEL_EN[rt]}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Notes 2 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.field.requestDate')} *</label>
              <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.field.notes2')}</label>
              <Input value={notes2} onChange={(e) => setNotes2(e.target.value)} placeholder="Optional…" />
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('req.field.lines')}</p>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" /> {t('opmod.action.addLine')}
              </Button>
            </div>

            {lines.map((line, i) => {
              const counter = line.mt5_account_number ? getCounterAccount(line.mt5_account_number) : null;
              const agentFlag = line.mt5_account_number ? isAgent(line.mt5_account_number) : false;
              const amtUsd = (parseFloat(line.amount_in_currency) || 0) * (parseFloat(line.exchange_rate) || 1);

              return (
                <div key={line.tempId} className="rounded-xl border border-border/60 bg-card p-3 space-y-3">
                  {lines.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-muted-foreground">Line {i + 1}</span>
                      <button onClick={() => removeLine(line.tempId)} className="text-destructive hover:opacity-70">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* MT5 Account + Counter */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.mt5Account')} *</label>
                      <Input
                        value={line.mt5_account_number}
                        onChange={(e) => updateLine(line.tempId, { mt5_account_number: e.target.value })}
                        placeholder="e.g. 12345"
                        className="font-mono"
                      />
                      {line.mt5_account_number && (
                        <p className={cn('mt-1 text-[10px] font-semibold', agentFlag ? 'text-sky-600' : 'text-emerald-600')}>
                          {agentFlag ? `⚡ ${t('opmod.field.agentDetected')}` : `✓ ${t('opmod.field.traderDetected')}`}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.counterAccount')}</label>
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-xs text-muted-foreground">
                        {counter ? (lang === 'ar' ? counter.name_ar : counter.name) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Source Account */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">{t('opmod.field.sourceAccount')} *</label>
                    <div className="relative">
                      <select
                        value={line.account_id}
                        onChange={(e) => updateLine(line.tempId, { account_id: e.target.value })}
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pe-8 text-sm"
                      >
                        <option value="">— {t('action.all')} —</option>
                        {MOCK_ACCOUNTS.filter((a) => !a.id.startsWith('mt5-')).map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.code}] {lang === 'ar' ? a.name_ar : a.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Amount + Currency + Rate */}
                  <div className="grid gap-2 grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.amount')} *</label>
                      <Input
                        type="number" step="0.01" min="0"
                        value={line.amount_in_currency}
                        onChange={(e) => updateLine(line.tempId, { amount_in_currency: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.currency')}</label>
                      <select
                        value={line.currency}
                        onChange={(e) => updateLine(line.tempId, { currency: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {['USD', 'USDT', 'EUR', 'GBP', 'TRY'].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.exchangeRate')}</label>
                      <Input
                        type="number" step="0.0001" min="0"
                        value={line.exchange_rate}
                        onChange={(e) => updateLine(line.tempId, { exchange_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* USD display + payment method */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.amountUsd')}</label>
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 font-mono text-sm font-semibold text-primary">
                        ${amtUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t('opmod.field.paymentMethod')}</label>
                      <select
                        value={line.payment_method_id}
                        onChange={(e) => updateLine(line.tempId, { payment_method_id: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— {t('action.all')} —</option>
                        {activeMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>{lang === 'ar' ? pm.name_ar : pm.name_en}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            {totalUsd > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Total (USD)</span>
                <span className="font-mono text-sm font-bold text-primary">
                  ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 space-y-1">
              {errors.map((e) => (
                <p key={e} className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t('action.cancel')}</Button>
            <Button type="button" variant="gradient" size="sm" onClick={handleSubmit}>{t('action.save')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
