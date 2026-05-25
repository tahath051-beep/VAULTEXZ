import { useMemo, useState } from 'react';
import { BarChart2, TrendingUp, Target } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { TrendChart } from '@/components/shared/TrendChart';
import { MiniBarChart } from '@/components/shared/MiniBarChart';
import { useOperationsStore } from '@/stores/operations.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import type { RequestType } from '@/lib/workbook';

const TYPE_COLORS: Record<RequestType, string> = {
  deposit: 'bg-emerald-500', withdrawal: 'bg-amber-500', ib_deposit: 'bg-sky-500',
  ib_withdrawal: 'bg-orange-500', transfer_to: 'bg-violet-500', transfer_from: 'bg-indigo-500', expense: 'bg-red-500',
};

const TYPE_LABELS: Record<RequestType, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal', ib_deposit: 'IB Dep', ib_withdrawal: 'IB Wdr',
  transfer_to: 'Xfer→', transfer_from: '←Xfer', expense: 'Expense',
};

type Range = '7d' | '30d' | '90d';

export default function OperationsAnalytics() {
  const { t } = useTranslation();
  const { requests } = useOperationsStore();
  const [range, setRange] = useState<Range>('30d');

  const rangeDays: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = rangeDays[range];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const inRange = useMemo(() => requests.filter((r) => r.date >= cutoffStr), [requests, cutoffStr]);

  const totalRequests = inRange.length;
  const completedRequests = inRange.filter((r) => r.status === 'voucher').length;
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
  const totalVolume = inRange.flatMap((r) => r.lines).reduce((s, l) => s + l.amount, 0);

  // Volume by type
  const volumeByType = useMemo(() => {
    const map: Partial<Record<RequestType, number>> = {};
    inRange.forEach((r) => {
      const v = r.lines.reduce((s, l) => s + l.amount, 0);
      map[r.type] = (map[r.type] ?? 0) + v;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([type, volume]) => ({ type: type as RequestType, volume: volume! }));
  }, [inRange]);

  // Count by type
  const countByType = useMemo(() => {
    const map: Partial<Record<RequestType, number>> = {};
    inRange.forEach((r) => { map[r.type] = (map[r.type] ?? 0) + 1; });
    return map;
  }, [inRange]);

  // Top accounts by volume
  const topAccounts = useMemo(() => {
    const map: Record<string, number> = {};
    inRange.flatMap((r) => r.lines).forEach((l) => {
      map[l.accountNo] = (map[l.accountNo] ?? 0) + l.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([account, volume]) => ({ account, volume }));
  }, [inRange]);

  // Status funnel
  const statusCounts = useMemo(() => ({
    pending: inRange.filter((r) => r.status === 'pending').length,
    confirmed: inRange.filter((r) => r.status === 'confirmed').length,
    executed: inRange.filter((r) => r.status === 'executed').length,
    voucher: inRange.filter((r) => r.status === 'voucher').length,
  }), [inRange]);

  // Daily volume for trend chart
  const dailySeries = useMemo(() => {
    const map: Record<string, number> = {};
    inRange.forEach((r) => {
      const v = r.lines.reduce((s, l) => s + l.amount, 0);
      map[r.date] = (map[r.date] ?? 0) + v;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({
      label: date.slice(5),
      value,
    }));
  }, [inRange]);

  const largestTx = useMemo(() => {
    const max = inRange.reduce((best, r) => {
      const v = r.lines.reduce((s, l) => s + l.amount, 0);
      return v > best.vol ? { vol: v, req: r } : best;
    }, { vol: 0, req: null as typeof inRange[0] | null });
    return max;
  }, [inRange]);

  const topAccountData = topAccounts.map((a) => ({ label: a.account, value: a.volume }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('analytics.title')}
        subtitle="Charts and trends about your client operations volume"
        hint={
          <PageHint id="ops-analytics" title="What is this page?">
            Analytics turns your operations data into visual charts. See which request types are most common, what time of day is busiest, and how your client activity has trended over time.
          </PageHint>
        }
        actions={
          <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1">
            {(['7d', '30d', '90d'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
                )}
              >
                {r === '7d' ? t('analytics.last7d') : r === '30d' ? t('analytics.last30d') : t('analytics.last90d')}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="sm:col-span-1 lg:col-span-2">
          <StatCard label={t('analytics.totalRequests')} value={totalRequests} icon={BarChart2} accent="blue" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <StatCard label={t('analytics.totalVolume')} value={`$${totalVolume.toLocaleString()}`} icon={TrendingUp} accent="green" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <StatCard label={t('analytics.completionRate')} value={`${completionRate.toFixed(1)}%`} icon={Target} accent="amber" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Volume trend */}
        <SectionCard title={`${t('analytics.volumeByType')} — ${range}`} className="sm:col-span-2">
          {dailySeries.length > 0 ? (
            <TrendChart data={dailySeries} height={200} formatValue={(v) => `$${(v / 1000).toFixed(1)}k`} />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No data in range</div>
          )}
        </SectionCard>

        {/* Volume by type breakdown */}
        <SectionCard title="Volume breakdown by type">
          <div className="space-y-3">
            {volumeByType.map(({ type, volume }) => {
              const pct = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', TYPE_COLORS[type])} />
                      <span className="font-medium">{TYPE_LABELS[type]}</span>
                      <span className="text-xs text-muted-foreground">({countByType[type] ?? 0}x)</span>
                    </div>
                    <span className="font-mono font-semibold">${volume.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', TYPE_COLORS[type])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {volumeByType.length === 0 && <p className="text-sm text-muted-foreground">No requests in range.</p>}
          </div>
        </SectionCard>

        {/* Status funnel */}
        <SectionCard title={t('analytics.statusFunnel')}>
          <div className="space-y-3">
            {[
              { label: 'Created', value: inRange.length, color: 'bg-muted' },
              { label: 'Confirmed', value: inRange.length - statusCounts.pending, color: 'bg-blue-500' },
              { label: 'Executed', value: statusCounts.executed + statusCounts.voucher, color: 'bg-violet-500' },
              { label: 'Voucher', value: statusCounts.voucher, color: 'bg-emerald-500' },
            ].map((s) => {
              const pct = inRange.length > 0 ? (s.value / inRange.length) * 100 : 0;
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="tabular-nums font-semibold">{s.value} <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', s.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Top accounts */}
      {topAccountData.length > 0 && (
        <SectionCard title={t('analytics.topClients')}>
          <MiniBarChart data={topAccountData} height={160} />
        </SectionCard>
      )}

      {/* Largest transaction callout */}
      {largestTx.req && (
        <SectionCard title={t('analytics.largestTx')}>
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-semibold">
                REQ-{String(largestTx.req.requestNo).padStart(3, '0')}
              </p>
              <p className="text-xs text-muted-foreground">{largestTx.req.date} · {largestTx.req.type}</p>
              <p className="text-xs text-muted-foreground">
                {largestTx.req.lines.map((l) => l.accountNo).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-primary">${largestTx.vol.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">USD</p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
