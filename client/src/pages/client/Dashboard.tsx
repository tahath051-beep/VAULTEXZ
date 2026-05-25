import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getClientDashboard, getClientAccounts } from '@/api/clientPortal.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const requestSchema = z.object({
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  note: z.string().optional(),
});

type RequestType = 'deposit' | 'withdrawal';

function RequestDialog({
  open,
  type,
  onClose,
}: {
  open: boolean;
  type: RequestType;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = requestSchema.safeParse({ amount: Number(amount), currency, note });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setError('');
    toast({ title: t('client.request.toast.submitted') });
    setAmount('');
    setNote('');
    onClose();
  };

  const titleKey = type === 'deposit' ? 'client.request.title.deposit' : 'client.request.title.withdrawal';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t('client.request.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('client.request.amount')} *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('client.request.currency')} *</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('client.request.note')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('client.request.notePlaceholder')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t('client.request.cancel')}</Button>
            <Button type="submit" size="sm" variant="gradient">{t('client.request.submit')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const statusIcon = (s: string) => {
  if (s === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (s === 'PENDING')  return <Clock className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['client-dashboard'], queryFn: getClientDashboard });
  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });
  const [dialogType, setDialogType] = useState<RequestType | null>(null);

  if (isLoading) return <PageLoader />;

  const m = data?.metrics;
  const pnl = m?.realized_pnl ?? 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-[1.75rem] font-bold tracking-tight sm:text-3xl">{t('client.dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t('client.dashboard.subtitle')}</p>
      </div>

      {/* Metric stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('client.totalBalance')}     value={`$${fmt(m?.total_balance ?? 0)}`}   icon={Wallet}      accent="blue" />
        <StatCard label={t('client.totalDeposits')}    value={`$${fmt(m?.total_deposits ?? 0)}`}   icon={TrendingUp}  accent="green" />
        <StatCard label={t('client.totalWithdrawals')} value={`$${fmt(m?.total_withdrawals ?? 0)}`} icon={TrendingDown} accent="amber" />
        <StatCard
          label={t('client.realizedPnl')}
          value={`${pnl >= 0 ? '+' : ''}$${fmt(pnl)}`}
          icon={DollarSign}
          accent={pnl >= 0 ? 'green' : 'pink'}
        />
      </div>

      {/* MT5 Account cards */}
      <div>
        <h2 className="text-base font-semibold mb-3">{t('client.myAccounts')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((acct) => (
            <SectionCard key={acct.id} bodyClassName="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">{acct.account_type} {t('client.account.type')}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{t('client.account.login')} {acct.mt5_login}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {acct.currency}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('client.balance')}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">${fmt(acct.balance)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('client.equity')}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-primary">${fmt(acct.equity)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('client.leverage')}</p>
                  <p className="mt-1 text-sm font-semibold">1:{acct.leverage}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('client.freeMargin')}</p>
                  <p className="mt-1 text-sm font-semibold">${fmt(acct.free_margin)}</p>
                </div>
              </div>
              {/* Equity bar */}
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (acct.equity / (acct.balance || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      {/* Make a Request */}
      <SectionCard title={t('client.makeRequest')} description={t('client.makeRequest.desc')}>
        <div className="flex gap-3">
          <Button
            variant="default"
            className="flex-1 gap-2 bg-success hover:bg-success/90 text-white"
            onClick={() => setDialogType('deposit')}
          >
            <ArrowUpRight className="h-4 w-4" />
            {t('client.deposit')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setDialogType('withdrawal')}
          >
            <ArrowDownRight className="h-4 w-4" />
            {t('client.withdrawal')}
          </Button>
        </div>
      </SectionCard>

      {dialogType && (
        <RequestDialog
          open={true}
          type={dialogType}
          onClose={() => setDialogType(null)}
        />
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={t('client.recentTransactions')}>
          {(data?.recent_transactions ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('client.noTransactions')}</p>
          ) : (
            <div className="space-y-3">
              {(data?.recent_transactions ?? []).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {statusIcon(tx.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === 'DEPOSIT' ? t('client.deposit') : t('client.withdrawal')}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold tabular-nums', tx.type === 'DEPOSIT' ? 'text-success' : 'text-warning')}>
                      {tx.type === 'DEPOSIT' ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                      ${fmt(tx.amount_usd)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('client.recentTrades')}>
          {(data?.recent_trades ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('client.noTrades')}</p>
          ) : (
            <div className="space-y-3">
              {(data?.recent_trades ?? []).map((tr) => (
                <div key={tr.id} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{tr.symbol}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold',
                        tr.direction === 'BUY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                      )}>{tr.direction}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(tr.close_time)}</p>
                  </div>
                  <p className={cn('text-sm font-semibold tabular-nums', tr.profit >= 0 ? 'text-success' : 'text-destructive')}>
                    {tr.profit >= 0 ? '+' : ''}${fmt(tr.profit)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
