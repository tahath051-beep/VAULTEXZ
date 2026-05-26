import { useState, useMemo } from 'react';
import { Search, Download, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  useOpModuleStore, OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN,
  type OpRequest,
} from '@/stores/opModule.store';
import { HistoryModal } from '@/components/operations/HistoryModal';

export default function CompletedPage() {
  const { t, lang } = useTranslation();
  const { requests, getTodayCompletedDeposits, getTodayCompletedWithdrawals } = useOpModuleStore();

  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [historyTarget, setHistoryTarget] = useState<OpRequest | null>(null);

  const completed = useMemo(() =>
    requests.filter((r) => r.status === 'completed'), [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return completed.filter((r) => {
      if (dateFrom && r.request_date < dateFrom) return false;
      if (dateTo && r.request_date > dateTo) return false;
      if (q) {
        const hit = r.request_number.toLowerCase().includes(q)
          || r.lines.some((l) => l.mt5_account_number.toLowerCase().includes(q))
          || r.notes_1.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [completed, search, dateFrom, dateTo]);

  const depositsToday = getTodayCompletedDeposits();
  const withdrawalsToday = getTodayCompletedWithdrawals();
  const netToday = depositsToday - withdrawalsToday;

  const handleExport = () => {
    const header = 'Request No,Date,Type,MT5 Account,Amount USD,Source Account,Counter Account,Notes 1,Journal Ref\n';
    const rows = filtered.map((r) =>
      [
        r.request_number, r.request_date,
        lang === 'ar' ? OP_TYPE_LABEL_AR[r.request_type] : OP_TYPE_LABEL_EN[r.request_type],
        r.lines.map((l) => l.mt5_account_number).join(';'),
        r.total_amount_usd,
        r.lines[0]?.account_name ?? '',
        r.lines[0]?.counter_account_name ?? '',
        r.notes_1,
        r.journal_entry_ref ?? '',
      ].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed-ops-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('opmod.completed.title')}
        subtitle={t('opmod.completed.subtitle')}
        hint={
          <PageHint id="op-completed" title={t('opmod.completed.title')}>
            {t('opmod.completed.compareHint')}
          </PageHint>
        }
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> {t('opmod.action.exportCsv')}
          </Button>
        }
      />

      {/* Summary cards — compare with MT5 daily report */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('opmod.completed.depositsToday')} value={`$${depositsToday.toLocaleString()}`} icon={TrendingUp} accent="green" />
        <StatCard label={t('opmod.completed.withdrawalsToday')} value={`$${withdrawalsToday.toLocaleString()}`} icon={TrendingDown} accent="amber" />
        <StatCard label={t('opmod.completed.netToday')} value={`$${netToday.toLocaleString()}`} icon={Scale} accent={netToday >= 0 ? 'green' : 'pink'} />
      </div>

      <SectionCard padded={false}>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Request number, MT5 account…" className="ps-9" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs self-end" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              All dates
            </Button>
          </div>
          <p className="text-xs text-muted-foreground self-end pb-0.5">{filtered.length} records</p>
        </div>

        {/* Hint about comparing with MT5 */}
        <div className="mx-4 mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          💡 {t('opmod.completed.compareHint')}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t('opmod.col.reqNo')}</TableHead>
                <TableHead className="w-24">{t('opmod.col.date')}</TableHead>
                <TableHead>{t('opmod.col.type')}</TableHead>
                <TableHead>{t('opmod.col.mt5')}</TableHead>
                <TableHead className="text-right">{t('opmod.col.amountUsd')}</TableHead>
                <TableHead>{t('opmod.col.sourceAccount')}</TableHead>
                <TableHead>{t('opmod.col.counterAccount')}</TableHead>
                <TableHead>{t('opmod.col.notes1')}</TableHead>
                <TableHead>{t('opmod.col.journalRef')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id} className="hover:bg-accent/20">
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-primary">{req.request_number}</span>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{req.request_date}</TableCell>
                  <TableCell>
                    <TypeChip type={req.request_type} lang={lang} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {req.lines.slice(0, 2).map((l) => <span key={l.id} className="font-mono text-xs text-muted-foreground">{l.mt5_account_number}</span>)}
                      {req.lines.length > 2 && <span className="text-[10px] text-muted-foreground">+{req.lines.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    ${req.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{req.lines[0]?.account_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{req.lines[0]?.counter_account_name ?? '—'}</TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-xs text-muted-foreground">{req.notes_1}</p>
                  </TableCell>
                  <TableCell>
                    {req.journal_entry_ref ? (
                      <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{req.journal_entry_ref}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => setHistoryTarget(req)} className="text-[10px] text-muted-foreground hover:text-foreground">
                      {t('opmod.action.viewHistory')}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">{t('opmod.empty.completed')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {historyTarget && <HistoryModal request={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}

function TypeChip({ type, lang }: { type: OpRequest['request_type']; lang: string }) {
  const COLORS: Record<string, string> = {
    deposit: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    withdrawal: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    agent_deposit: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    agent_withdrawal: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    transfer_from: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    transfer_to: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    expense: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  };
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', COLORS[type] ?? 'bg-muted text-muted-foreground')}>
      {lang === 'ar' ? OP_TYPE_LABEL_AR[type] : OP_TYPE_LABEL_EN[type]}
    </span>
  );
}
