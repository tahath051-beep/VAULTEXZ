import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Landmark, Users as UsersIcon, Truck, Handshake, BadgeDollarSign,
  TrendingUp, ReceiptText, ListChecks, Database, ArrowRight, Calendar, Download,
  ShieldCheck, Activity, ChevronDown, Check,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { SectionCard } from '@/components/shared/SectionCard';
import { CategoryCard, type CategoryTone } from '@/components/shared/CategoryCard';
import { MoneyCell } from '@/components/shared/MoneyCell';
import { TrendChart } from '@/components/shared/TrendChart';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { AIInsightsCard } from '@/components/shared/AIInsightsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { sum, type Category } from '@/lib/workbook';
import { useWorkbookStore } from '@/stores/workbook.store';

interface CatDef {
  key: Category;
  labelKey: string;
  tone: CategoryTone;
  icon: typeof Wallet;
  route: string;
}

const categoryDefs: CatDef[] = [
  { key: 'funds',     labelKey: 'cat.funds',     tone: 'funds',     icon: Wallet,          route: '/report?cat=funds' },
  { key: 'banks',     labelKey: 'cat.banks',     tone: 'banks',     icon: Landmark,        route: '/report?cat=banks' },
  { key: 'clients',   labelKey: 'cat.clients',   tone: 'clients',   icon: UsersIcon,       route: '/report?cat=clients' },
  { key: 'suppliers', labelKey: 'cat.suppliers', tone: 'suppliers', icon: Truck,           route: '/report?cat=suppliers' },
  { key: 'partners',  labelKey: 'cat.partners',  tone: 'partners',  icon: Handshake,       route: '/report?cat=partners' },
  { key: 'staff',     labelKey: 'cat.staff',     tone: 'staff',     icon: BadgeDollarSign, route: '/report?cat=staff' },
  { key: 'revenue',   labelKey: 'cat.revenue',   tone: 'revenue',   icon: TrendingUp,      route: '/report?cat=revenue' },
  { key: 'expenses',  labelKey: 'cat.expenses',  tone: 'expenses',  icon: ReceiptText,     route: '/report?cat=expenses' },
  { key: 'debts',     labelKey: 'cat.debts',     tone: 'debts',     icon: ListChecks,      route: '/report?cat=debts' },
];

const fmt0 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

function SubTable({
  title, tone, rows, columns,
}: {
  title: string;
  tone: CategoryTone;
  rows: { code: string; name: string; arabic?: string; balance: number }[];
  columns?: 1 | 2 | 3 | 4;
}) {
  const cols = columns ?? 3;
  const total = rows.reduce((acc, r) => acc + r.balance, 0);
  const stripeMap: Record<CategoryTone, string> = {
    funds: 'bg-orange-400',  banks: 'bg-sky-400',      clients: 'bg-pink-400',
    suppliers: 'bg-emerald-400', partners: 'bg-rose-400', staff: 'bg-amber-400',
    revenue: 'bg-violet-400', expenses: 'bg-red-400',   debts: 'bg-teal-400',
    platform: 'bg-indigo-400',
  };

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span className={cn('inline-block h-2 w-2 rounded-full', stripeMap[tone])} />
          <span>{title}</span>
        </span>
      }
      action={<MoneyCell value={total} signColor={false} bold className="text-base" />}
      bodyClassName="p-0"
    >
      <div
        className={cn(
          'grid divide-y divide-border/40 sm:divide-y-0 sm:divide-x sm:divide-border/40',
          cols === 1 && 'sm:grid-cols-1',
          cols === 2 && 'sm:grid-cols-2',
          cols === 3 && 'sm:grid-cols-3',
          cols === 4 && 'sm:grid-cols-4',
        )}
      >
        {Array.from({ length: cols }).map((_, colIdx) => {
          const colItems = rows.filter((_, i) => i % cols === colIdx);
          return (
            <div key={colIdx} className="divide-y divide-border/40">
              {colItems.map((row) => (
                <div
                  key={row.code + row.name}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-accent/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                    {row.arabic && (
                      <p className="truncate text-xs text-muted-foreground" dir="rtl">{row.arabic}</p>
                    )}
                  </div>
                  <MoneyCell value={row.balance} small bold />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const accounts     = useWorkbookStore((s) => s.accounts);
  const mt5Data      = useWorkbookStore((s) => s.mt5);
  const coverageData = useWorkbookStore((s) => s.coverage);
  const rates        = useWorkbookStore((s) => s.rates);

  const fundRows     = useMemo(() => accounts.filter((a) => a.category === 'funds'),     [accounts]);
  const bankRows     = useMemo(() => accounts.filter((a) => a.category === 'banks'),     [accounts]);
  const clientRows   = useMemo(() => accounts.filter((a) => a.category === 'clients'),   [accounts]);
  const supplierRows = useMemo(() => accounts.filter((a) => a.category === 'suppliers'), [accounts]);
  const partnerRows  = useMemo(() => accounts.filter((a) => a.category === 'partners'),  [accounts]);
  const staffRows    = useMemo(() => accounts.filter((a) => a.category === 'staff'),     [accounts]);
  const revenueRows  = useMemo(() => accounts.filter((a) => a.category === 'revenue'),   [accounts]);
  const expenseRows  = useMemo(() => accounts.filter((a) => a.category === 'expenses'),  [accounts]);
  const debtRows     = useMemo(() => accounts.filter((a) => a.category === 'debts'),     [accounts]);

  const totals = useMemo(() => ({
    funds:     sum(fundRows),
    banks:     sum(bankRows),
    clients:   sum(clientRows),
    suppliers: sum(supplierRows),
    partners:  sum(partnerRows),
    staff:     sum(staffRows),
    revenue:   sum(revenueRows),
    expenses:  sum(expenseRows),
    debts:     sum(debtRows),
  }), [fundRows, bankRows, clientRows, supplierRows, partnerRows, staffRows, revenueRows, expenseRows, debtRows]);

  const mt5 = useMemo(() => mt5Data.reduce((acc, a) => acc + a.balance, 0), [mt5Data]);
  const totalCover = useMemo(() => coverageData.reduce((acc, c) => acc + c.value, 0), [coverageData]);

  const equitySummary = useMemo(() => {
    const blockBalance = totals.funds + totals.banks + totals.clients + totals.suppliers
      + totals.partners + totals.staff + totals.expenses + totals.debts;
    const curEquity   = -mt5;
    const surplus     = blockBalance + curEquity;
    const liquidMass  = totals.funds + totals.banks;
    const fastLiquid  = totals.banks + totals.funds * 0.7;
    const cashSavings = surplus + totals.revenue;
    return { blockBalance, curEquity, surplus, liquidMass, fastLiquid, cashSavings };
  }, [totals, mt5]);

  const ratesSeries = useMemo(
    () => rates.slice(-12).map((r) => ({ label: r.date.slice(5), value: r.rate })),
    [rates],
  );

  const reconHealth = Math.max(0, Math.min(100, 100 - Math.abs(equitySummary.surplus) / 5000));

  /* ── Date range picker ───────────────────────────────────── */
  type Period = 'today' | 'week' | 'month' | 'quarter' | 'ytd';
  const [period, setPeriod] = useState<Period>('month');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const periodOptions: { key: Period; labelKey: string; range: () => [Date, Date] }[] = [
    { key: 'today',   labelKey: 'period.today',   range: () => { const d = new Date(); return [d, d]; } },
    { key: 'week',    labelKey: 'period.week',    range: () => { const d = new Date(); const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return [s, d]; } },
    { key: 'month',   labelKey: 'period.month',   range: () => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1), d]; } },
    { key: 'quarter', labelKey: 'period.quarter', range: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return [new Date(d.getFullYear(), q * 3, 1), d]; } },
    { key: 'ytd',     labelKey: 'period.ytd',     range: () => { const d = new Date(); return [new Date(d.getFullYear(), 0, 1), d]; } },
  ];

  const activePeriod = periodOptions.find((p) => p.key === period)!;
  const [rangeStart, rangeEnd] = activePeriod.range();
  const fmtRange = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  // Filter rate series based on selected period
  const filteredRatesSeries = useMemo(() => {
    const [start] = activePeriod.range();
    const startIso = start.toISOString().slice(0, 10);
    const filtered = rates.filter((r) => r.date >= startIso);
    const src = filtered.length >= 2 ? filtered : rates.slice(-12);
    return src.map((r) => ({ label: r.date.slice(5), value: r.rate }));
  }, [rates, period]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('equity.title')}
        subtitle={t('equity.subtitle2')}
        actions={
          <>
            {/* Period picker */}
            <div ref={pickerRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPickerOpen((o) => !o)}
              >
                <Calendar className="h-3.5 w-3.5" />
                {t(activePeriod.labelKey as Parameters<typeof t>[0])}
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${pickerOpen ? 'rotate-180' : ''}`} />
              </Button>

              {pickerOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-44 rounded-2xl border border-border bg-popover shadow-shadow-3 overflow-hidden animate-slide-up">
                  {periodOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setPeriod(opt.key); setPickerOpen(false); }}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <span className={period === opt.key ? 'font-semibold text-primary' : 'text-foreground'}>
                        {t(opt.labelKey as Parameters<typeof t>[0])}
                      </span>
                      {period === opt.key && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                  <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                    {fmtRange(rangeStart)} – {fmtRange(rangeEnd)}
                  </div>
                </div>
              )}
            </div>

            <Button variant="gradient" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {t('action.export')}
            </Button>
          </>
        }
      />

      {/* Hero KPI banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'radial-gradient(circle at 20% 50%, hsl(222 91% 65%) 0%, hsl(222 84% 50%) 45%, hsl(262 84% 42%) 100%)' }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('equity.blockBalance'), value: equitySummary.blockBalance, icon: ShieldCheck, tip: 'The total value locked in trading accounts on your platform' },
            { label: t('equity.liquidMass'),   value: equitySummary.liquidMass,   icon: Activity,   tip: 'How quickly you could convert assets to cash' },
            { label: t('equity.fastLiquid'),   value: equitySummary.fastLiquid,   icon: TrendingUp, tip: 'Highly liquid assets available immediately — cash and near-cash' },
            { label: t('equity.cashSavings'),  value: equitySummary.cashSavings,  icon: Wallet,     tip: 'Surplus cash after covering all obligations' },
          ].map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1">
                  {kpi.label}
                  <HelpTooltip text={kpi.tip} side="bottom" className="opacity-60" />
                </p>
                <p className="mt-0.5 text-xl font-black tabular-nums tracking-tight">{fmt2(kpi.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category strip — 9 colored balance cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {categoryDefs.map((c, idx) => (
          <Link key={c.key} to={c.route} className="contents">
            <div style={{ animationDelay: `${idx * 0.04}s` }} className="animate-slide-up">
              <CategoryCard
                label={t(c.labelKey as Parameters<typeof t>[0])}
                tone={c.tone}
                icon={c.icon}
                value={<MoneyCell value={(totals as Record<string, number>)[c.key] ?? 0} signColor={false} className="text-xl" bold />}
                hint={<span className="text-muted-foreground/80">{t('action.clickForDetail')}</span>}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* MT5 Equity */}
      <SectionCard
        title={t('equity.mt5')}
        description={t('equity.mt5Desc')}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t('equity.totalEquity')}</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-base font-bold text-primary tabular-nums">
              {fmt0(mt5)}
            </span>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="grid grid-cols-2 divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0 sm:divide-x lg:grid-cols-8">
          {mt5Data.map((acc) => (
            <div key={acc.code} className="flex flex-col items-center justify-center gap-1 px-3 py-4 transition-colors hover:bg-accent/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{acc.code}</span>
              <span className="text-base font-bold tabular-nums text-foreground">{fmt0(acc.balance)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Coverage + Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title={t('equity.coverage')}
          description={t('equity.coverageDesc')}
          action={
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 tabular-nums">
              {fmt0(totalCover)}
            </span>
          }
          bodyClassName="p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {coverageData.map((c, i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-sm font-bold tabular-nums">{fmt0(c.value)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t('equity.balanceSummary')}
          description={t('equity.balanceSummaryDesc')}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="grid grid-cols-2 divide-y divide-border/40 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            {[
              { labelKey: 'equity.blockBalance', value: equitySummary.blockBalance, tone: 'foreground' as const, borderColor: 'border-l-primary',     tip: 'The total value locked in trading accounts on your platform' },
              { labelKey: 'equity.curEquity',    value: equitySummary.curEquity,    tone: 'destructive' as const, borderColor: 'border-l-destructive', tip: 'Currency equity — the net value of all foreign currency positions' },
              { labelKey: 'equity.surplus',      value: equitySummary.surplus,      tone: 'destructive' as const, borderColor: 'border-l-destructive', tip: 'How much more you have than you owe. Positive = healthy buffer.' },
              { labelKey: 'equity.liquidMass',   value: equitySummary.liquidMass,   tone: 'success' as const, borderColor: 'border-l-success',         tip: 'How quickly you could convert assets to cash' },
              { labelKey: 'equity.fastLiquid',   value: equitySummary.fastLiquid,   tone: 'success' as const, borderColor: 'border-l-success',         tip: 'Highly liquid assets available immediately — cash and near-cash' },
              { labelKey: 'equity.cashSavings',  value: equitySummary.cashSavings,  tone: 'success' as const, borderColor: 'border-l-success',         tip: 'Surplus cash after covering all obligations' },
            ].map((s) => (
              <div key={s.labelKey} className={cn('flex flex-col gap-1 border-l-[3px] px-5 py-4', s.borderColor)}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  {t(s.labelKey as Parameters<typeof t>[0])}
                  <HelpTooltip text={s.tip} side="top" />
                </p>
                <p className={cn('mt-1 text-lg font-bold tabular-nums',
                  s.tone === 'destructive' && 'text-destructive',
                  s.tone === 'success' && 'text-success',
                )}>
                  {fmt2(s.value)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Chart + Gauge + AI */}
      <div className="grid gap-4 lg:grid-cols-6">
        <SectionCard
          title={t('equity.fxHeader')}
          description={t('equity.fxDesc')}
          className="lg:col-span-3"
          action={
            rates.length > 0 ? (
              <Badge variant="success" className="gap-1">
                <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                {rates[rates.length - 1].rate.toFixed(2)}
              </Badge>
            ) : null
          }
        >
          <TrendChart data={filteredRatesSeries} height={220} formatValue={(v) => v.toFixed(2)} />
        </SectionCard>

        <SectionCard
          title={t('equity.reconHealth')}
          description={t('equity.reconDesc')}
          className="lg:col-span-2"
        >
          <GaugeChart value={reconHealth} label={t('equity.balanced')} height={200} />
        </SectionCard>

        <AIInsightsCard
          className="lg:col-span-1"
          insights={[
            { title: 'High client debt', body: 'Darna Holding holds -$20,000 — second-largest client liability.' },
            { title: 'Suppliers OK',     body: 'AL ARABIA at -$12,000; outstanding payable to be cleared.' },
            { title: 'Cover ratio',      body: `${((totalCover / (mt5 || 1)) * 100).toFixed(1)}% coverage on MT5 equity.` },
          ]}
        />
      </div>

      {/* Detailed sub-tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SubTable title={t('cat.funds')}   tone="funds"     rows={fundRows}     columns={3} />
        <SubTable title={t('cat.banks')}   tone="banks"     rows={bankRows}     columns={2} />
      </div>

      <SubTable title={t('cat.clients')}   tone="clients"   rows={clientRows}   columns={4} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SubTable title={t('cat.suppliers')} tone="suppliers" rows={supplierRows} columns={2} />
        <SubTable title={t('cat.staff')}     tone="staff"     rows={staffRows}    columns={2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SubTable title={t('cat.revenue')}  tone="revenue"  rows={revenueRows} columns={1} />
        <SubTable title={t('cat.expenses')} tone="expenses" rows={expenseRows} columns={2} />
        <SubTable title={t('cat.debts')}    tone="debts"    rows={debtRows}    columns={1} />
      </div>

      {/* Quick links to other sheets */}
      <SectionCard title={t('equity.workbookSheets')} description={t('equity.quickNav')}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { to: '/entries',  labelKey: 'sheet.entries',  descKey: 'equity.doubleEntryLog' },
            { to: '/report',   labelKey: 'sheet.report',   descKey: 'equity.balancesSummary' },
            { to: '/data',     labelKey: 'sheet.data',     descKey: 'equity.chartOfAccounts' },
            { to: '/opening',  labelKey: 'sheet.opening',  descKey: 'equity.startingBalances' },
            { to: '/vouchers', labelKey: 'sheet.vouchers', descKey: 'equity.receiptTracking' },
            { to: '/currency', labelKey: 'sheet.currency', descKey: 'equity.fxRateHistory' },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-shadow-2"
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t(q.labelKey as Parameters<typeof t>[0])}</p>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t(q.descKey as Parameters<typeof t>[0])}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
