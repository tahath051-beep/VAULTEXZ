import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getClientDashboard, getClientAccounts } from '@/api/clientPortal.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcon = (s: string) => {
  if (s === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (s === 'PENDING')  return <Clock className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['client-dashboard'], queryFn: getClientDashboard });
  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });

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
                  <p className="text-sm font-semibold">{acct.account_type} Account</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Login: {acct.mt5_login}</p>
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
