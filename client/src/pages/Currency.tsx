import { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, WifiOff } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { TrendChart } from '@/components/shared/TrendChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AddRateButton } from '@/components/shared/AddRowModals';
import { useLiveRates } from '@/hooks/useLiveRates';
import { cn } from '@/lib/utils';

const PAIRS = ['USD/TRY', 'USD/EUR', 'EUR/USD'] as const;
type Pair = typeof PAIRS[number];

export default function Currency() {
  const { t } = useTranslation();
  const rates = useWorkbookStore((s) => s.rates);
  const liveRates = useWorkbookStore((s) => s.liveRates);
  const { isLive, isLoading, error, secondsAgo, refresh } = useLiveRates();

  const [selectedPair, setSelectedPair] = useState<Pair>('USD/TRY');

  const storeRates = rates;
  const latest = storeRates[storeRates.length - 1];
  const first = storeRates[0];

  // Use live rate if available for display (USD/TRY)
  const liveRate = liveRates['USD/TRY'];
  const currentRate = selectedPair === 'USD/TRY' && liveRate ? liveRate : latest?.rate ?? 0;
  const delta = first ? ((currentRate - first.rate) / first.rate) * 100 : 0;
  const high = Math.max(...storeRates.map((r) => r.rate), currentRate);
  const low  = Math.min(...storeRates.map((r) => r.rate), currentRate);

  const series = useMemo(
    () => storeRates.map((r) => ({ label: r.date.slice(5), value: r.rate })),
    [storeRates],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('currency.title')}
        subtitle={t('currency.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5">
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('currency.live')}</span>
                  {secondsAgo > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {t('currency.lastUpdated').replace('{s}', String(secondsAgo))}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {error ? t('currency.fetchError') : t('currency.offline')}
                  </span>
                </>
              )}
            </div>

            {/* Pair selector */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
              {PAIRS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPair(p)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-mono font-semibold transition-colors',
                    selectedPair === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent/60',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className={cn('h-8 w-8', isLoading && 'animate-spin')}
              title={t('currency.refresh')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            <AddRateButton />
          </div>
        }
      />

      {/* Hero rate display */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">{selectedPair}</span>
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{t('currency.live')}</span>
                </span>
              )}
            </div>
            <div className="flex items-end gap-4 mt-2">
              <p className="text-6xl font-black tabular-nums tracking-tight leading-none">
                {currentRate.toFixed(2)}
              </p>
              <Badge
                variant={delta >= 0 ? 'success' : 'destructive'}
                className={`mb-1 gap-1 text-sm font-bold px-3 py-1 ${delta >= 0 ? 'bg-success/12' : 'bg-destructive/12'}`}
              >
                {delta >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {delta >= 0 ? '+' : ''}{Math.abs(delta).toFixed(2)}%
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t('currency.sinceStart')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-success/8 border border-success/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('currency.peak')}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-success">{high.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('currency.trough')}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-destructive">{low.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live rates panel */}
      {Object.keys(liveRates).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(liveRates).map(([pair, rate]) => (
            <SectionCard key={pair} bodyClassName="p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{pair}</span>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('currency.live')}
                </Badge>
              </div>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">{rate.toFixed(4)}</p>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard
        title={`${selectedPair} history`}
        description={`${storeRates.length} ${t('currency.observations').split('·')[0].trim()} · ${first?.date ?? '—'} → ${latest?.date ?? '—'}`}
      >
        <TrendChart data={series} height={280} formatValue={(v) => v.toFixed(2)} />
      </SectionCard>

      <SectionCard
        title={t('currency.log')}
        description={t('currency.logDesc')}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t('currency.col.date')}</TableHead>
                <TableHead>{t('currency.col.pair')}</TableHead>
                <TableHead className="w-32 text-right">{t('currency.col.rate')}</TableHead>
                <TableHead className="w-40 text-right">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...storeRates].reverse().map((r, i, arr) => {
                const prev = arr[i + 1];
                const d = prev ? r.rate - prev.rate : 0;
                return (
                  <TableRow key={r.date}>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold">USD/TRY</TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums">{r.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {prev ? (
                        <span className={cn(
                          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                          d >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                        )}>
                          {d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {d >= 0 ? '+' : ''}{d.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
