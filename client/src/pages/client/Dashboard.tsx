import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getClientDashboard, getClientAccounts } from '@/api/clientPortal.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react';

const statusIcon = (s: string) => {
  if (s === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === 'PENDING')  return <Clock className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const statusText: Record<string, string> = {
  APPROVED: 'text-green-600 dark:text-green-400',
  PENDING:  'text-yellow-600 dark:text-yellow-400',
  REJECTED: 'text-destructive',
};

export default function ClientDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['client-dashboard'], queryFn: getClientDashboard });
  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });

  if (isLoading) return <PageLoader />;

  const m = data?.metrics;

  const metricCards = [
    {
      label: 'Total Balance',
      value: `$${fmt(m?.total_balance ?? 0)}`,
      icon: Wallet,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
    },
    {
      label: 'Total Deposits',
      value: `$${fmt(m?.total_deposits ?? 0)}`,
      icon: TrendingUp,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Total Withdrawals',
      value: `$${fmt(m?.total_withdrawals ?? 0)}`,
      icon: TrendingDown,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      valueColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'Realized P&L',
      value: `${(m?.realized_pnl ?? 0) >= 0 ? '+' : ''}$${fmt(m?.realized_pnl ?? 0)}`,
      icon: DollarSign,
      iconBg: (m?.realized_pnl ?? 0) >= 0 ? 'bg-green-500/10' : 'bg-destructive/10',
      iconColor: (m?.realized_pnl ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive',
      valueColor: (m?.realized_pnl ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your account overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${valueColor}`}>{value}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MT5 Account cards */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">My Accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((acct) => (
            <Card key={acct.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{acct.account_type} Account</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Login: {acct.mt5_login}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                    {acct.currency}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold text-foreground">${fmt(acct.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Equity</p>
                    <p className="text-lg font-bold text-primary">${fmt(acct.equity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Leverage</p>
                    <p className="text-sm font-semibold text-foreground">1:{acct.leverage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Free Margin</p>
                    <p className="text-sm font-semibold text-foreground">${fmt(acct.free_margin)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="font-semibold text-sm text-foreground">Recent Transactions</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(data?.recent_transactions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {(data?.recent_transactions ?? []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(t.status)}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                        </p>
                        <p className="text-xs text-muted-foreground">{fmtDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}${fmt(t.amount_usd)}
                      </p>
                      <p className={`text-xs ${statusText[t.status] ?? 'text-muted-foreground'}`}>{t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent trades */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="font-semibold text-sm text-foreground">Recent Trades</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(data?.recent_trades ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No trades yet</p>
            ) : (
              <div className="space-y-3">
                {(data?.recent_trades ?? []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{t.symbol}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          t.direction === 'BUY'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>{t.direction}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(t.close_time)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {t.profit >= 0 ? '+' : ''}${fmt(t.profit)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
