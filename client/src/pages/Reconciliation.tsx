import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { mt5Accounts } from '@/lib/workbook';
import { cn } from '@/lib/utils';

interface ReconRow {
  account: string;
  mt5: number;
  book: number;
  gap: number;
  gapPct: number;
}

const BOOK_BALANCES: Record<string, number> = {
  FOC: 109, CENT: 11200, A20: 6400, A50: 4800,
  A80: 30000, A100: 900, BBC: 52000, A60: 298000,
};

export default function Reconciliation() {
  const { t } = useTranslation();

  const rows: ReconRow[] = useMemo(() => mt5Accounts.map((acc) => {
    const book = BOOK_BALANCES[acc.code] ?? acc.balance;
    const gap = acc.balance - book;
    const gapPct = book !== 0 ? (gap / book) * 100 : 0;
    return { account: acc.code, mt5: acc.balance, book, gap, gapPct };
  }), []);

  const totalMT5 = rows.reduce((s, r) => s + r.mt5, 0);
  const totalBook = rows.reduce((s, r) => s + r.book, 0);
  const totalGap = totalMT5 - totalBook;
  const reconScore = Math.max(0, 100 - Math.abs((totalGap / totalBook) * 100));
  const reconOk = rows.filter((r) => Math.abs(r.gapPct) < 1).length;
  const reconWarn = rows.filter((r) => Math.abs(r.gapPct) >= 1 && Math.abs(r.gapPct) < 5).length;
  const reconFail = rows.filter((r) => Math.abs(r.gapPct) >= 5).length;

  const getGapColor = (gapPct: number) => {
    const abs = Math.abs(gapPct);
    if (abs < 1) return 'text-success';
    if (abs < 5) return 'text-amber-600';
    return 'text-destructive';
  };

  const getGapIcon = (gapPct: number) => {
    const abs = Math.abs(gapPct);
    if (abs < 1) return <CheckCircle className="h-4 w-4 text-success" />;
    if (abs < 5) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('recon.title')}
        subtitle={t('recon.subtitle')}
        hint={
          <PageHint id="reconciliation" title="What is this page?">
            Reconciliation means comparing your internal records with external statements (bank, LP, platform) to make sure they match. Any gap is called a "break" and must be investigated and resolved.
          </PageHint>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title={t('recon.health')} bodyClassName="p-5">
          <GaugeChart value={reconScore} height={180} />
          <p className="mt-2 text-center text-sm font-semibold">
            {reconScore >= 95 ? t('health.excellent') : reconScore >= 80 ? t('health.good') : t('health.needsAttention')}
          </p>
        </SectionCard>

        <div className="space-y-4 sm:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t('recon.mt5Equity')} value={`$${totalMT5.toLocaleString()}`} icon={CheckCircle} accent="blue" />
            <StatCard label={t('recon.bookEquity')} value={`$${totalBook.toLocaleString()}`} icon={CheckCircle} accent="green" />
            <StatCard
              label={t('recon.gap')}
              value={`${totalGap >= 0 ? '+' : ''}$${totalGap.toLocaleString()}`}
              icon={totalGap === 0 ? CheckCircle : AlertTriangle}
              accent={totalGap === 0 ? 'green' : 'amber'}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <CheckCircle className="mx-auto mb-1 h-5 w-5 text-success" />
              <p className="text-2xl font-bold text-success">{reconOk}</p>
              <p className="text-xs text-muted-foreground">Reconciled</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">{reconWarn}</p>
              <p className="text-xs text-muted-foreground">Minor gap (&lt;5%)</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <XCircle className="mx-auto mb-1 h-5 w-5 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{reconFail}</p>
              <p className="text-xs text-muted-foreground">Significant gap</p>
            </div>
          </div>
        </div>
      </div>

      <SectionCard title={t('recon.perAccount')} padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Account</TableHead>
                <TableHead className="text-right">{t('recon.col.mt5')}</TableHead>
                <TableHead className="text-right">{t('recon.col.book')}</TableHead>
                <TableHead className="text-right">{t('recon.col.gap')}</TableHead>
                <TableHead className="text-right w-20">{t('recon.col.gapPct')}</TableHead>
                <TableHead className="w-16 text-center">{t('recon.col.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.account}>
                  <TableCell className="font-mono text-sm font-bold">{r.account}</TableCell>
                  <TableCell className="text-right tabular-nums">${r.mt5.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">${r.book.toLocaleString()}</TableCell>
                  <TableCell className={cn('text-right font-semibold tabular-nums', getGapColor(r.gapPct))}>
                    {r.gap >= 0 ? '+' : ''}${r.gap.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono text-xs', getGapColor(r.gapPct))}>
                    {r.gapPct >= 0 ? '+' : ''}{r.gapPct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">{getGapIcon(r.gapPct)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/40">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">${totalMT5.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">${totalBook.toLocaleString()}</TableCell>
                <TableCell className={cn('text-right tabular-nums', getGapColor((totalGap / totalBook) * 100))}>
                  {totalGap >= 0 ? '+' : ''}${totalGap.toLocaleString()}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
