
import { Wallet, Building2, TrendingUp, Lock, Unlock, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { funds, banks, mt5Accounts, sum, equitySummary } from '@/lib/workbook';
import { cn } from '@/lib/utils';

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Treasury() {
  const { t } = useTranslation();
  const eq = equitySummary();
  const totalFunds = sum(funds);
  const totalBanks = sum(banks);
  const totalMT5 = sum(mt5Accounts.map((a) => ({ balance: a.balance })));
  const liquidAssets = totalFunds + totalBanks;
  const freeLiquidity = liquidAssets - totalMT5;

  const allAccounts = [...funds, ...banks];
  const totalPool = allAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);

  const allocationData = [
    { label: 'Funds', value: totalFunds, color: 'bg-orange-500' },
    { label: 'Banks', value: totalBanks, color: 'bg-sky-500' },
    { label: 'MT5', value: totalMT5, color: 'bg-violet-500' },
  ];

  const healthIndicators = [
    {
      label: t('treasury.fastLiquid'),
      value: eq.fastLiquid,
      threshold: 50000,
      good: eq.fastLiquid > 50000,
    },
    {
      label: 'Surplus',
      value: eq.surplus,
      threshold: 0,
      good: eq.surplus >= 0,
    },
    {
      label: t('treasury.cashCoverage'),
      value: liquidAssets,
      threshold: totalMT5,
      good: liquidAssets >= totalMT5 * 0.7,
    },
  ];

  const fundRows = funds.map((f) => ({
    name: f.name,
    arabic: f.arabic,
    balance: f.balance,
    pct: totalFunds > 0 ? (f.balance / totalFunds) * 100 : 0,
    status: f.balance < 0 ? 'negative' : f.balance < 1000 ? 'low' : 'ok',
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('treasury.title')}
        subtitle={t('treasury.subtitle')}
        hint={
          <PageHint id="treasury" title={t('hint.treasury.title')}>
            {t('hint.treasury.body')}
          </PageHint>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t('treasury.totalFunds')} value={`$${totalFunds.toLocaleString()}`} icon={Wallet} accent="amber" />
        <StatCard label={t('treasury.totalBanks')} value={`$${totalBanks.toLocaleString()}`} icon={Building2} accent="blue" />
        <StatCard label={t('treasury.liquidAssets')} value={`$${liquidAssets.toLocaleString()}`} icon={Unlock} accent="green" />
        <StatCard
          label={t('treasury.freeLiquidity')}
          value={`$${freeLiquidity.toLocaleString()}`}
          icon={freeLiquidity >= 0 ? TrendingUp : Lock}
          accent={freeLiquidity >= 0 ? 'green' : 'pink'}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Fund allocation */}
        <SectionCard title={t('treasury.allocation')}>
          <div className="space-y-4">
            {allocationData.map((d) => (
              <div key={d.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-3 w-3 rounded-full', d.color)} />
                    <span className="font-medium">{d.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold">${d.value.toLocaleString()}</span>
                    <span className="ms-1.5 text-xs text-muted-foreground">
                      {totalPool > 0 ? ((d.value / totalPool) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={d.value} max={totalPool} color={d.color} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Health indicators */}
        <SectionCard title={t('treasury.ratios')}>
          <div className="space-y-4">
            {healthIndicators.map((h) => (
              <div key={h.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                <div>
                  <p className="text-sm font-semibold">{h.label}</p>
                  <p className="font-mono text-lg font-bold tabular-nums">${h.value.toLocaleString()}</p>
                </div>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  h.good ? 'bg-success/10' : 'bg-destructive/10',
                )}>
                  {h.good
                    ? <TrendingUp className="h-5 w-5 text-success" />
                    : <AlertCircle className="h-5 w-5 text-destructive" />
                  }
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Fund health table */}
      <SectionCard title={t('treasury.healthTable')} padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-36">Allocation</TableHead>
                <TableHead className="w-20 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundRows.map((f) => (
                <TableRow key={f.name}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{f.name}</p>
                      {f.arabic && <p className="text-xs text-muted-foreground">{f.arabic}</p>}
                    </div>
                  </TableCell>
                  <TableCell className={cn('text-right font-mono font-semibold tabular-nums', f.balance < 0 && 'text-destructive')}>
                    {f.balance < 0 ? '-' : ''}${Math.abs(f.balance).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={Math.max(0, f.balance)} max={totalFunds} color="bg-orange-500" />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground">{f.pct.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      f.status === 'ok' ? 'bg-success/10 text-success' :
                      f.status === 'low' ? 'bg-amber-100 text-amber-700' :
                      'bg-destructive/10 text-destructive',
                    )}>
                      {f.status === 'ok' ? 'OK' : f.status === 'low' ? 'Low' : 'Negative'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
