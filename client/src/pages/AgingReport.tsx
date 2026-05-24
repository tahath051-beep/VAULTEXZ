import { useMemo } from 'react';
import { Clock, AlertTriangle, TrendingDown, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { clients } from '@/lib/workbook';
import { cn } from '@/lib/utils';

type Bucket = '0-30' | '30-60' | '60-90' | '90+';

interface AgingRow {
  code: string;
  name: string;
  arabic?: string;
  balance: number;
  lastActivityDaysAgo: number;
  bucket: Bucket;
}

function getBucket(days: number): Bucket {
  if (days <= 30) return '0-30';
  if (days <= 60) return '30-60';
  if (days <= 90) return '60-90';
  return '90+';
}

const BUCKET_COLOR: Record<Bucket, string> = {
  '0-30': 'bg-success/10 text-success',
  '30-60': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  '60-90': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  '90+': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const BUCKET_BAR_COLOR: Record<Bucket, string> = {
  '0-30': 'bg-emerald-500',
  '30-60': 'bg-amber-500',
  '60-90': 'bg-orange-500',
  '90+': 'bg-red-500',
};

// Simulate last activity from seeded data (days since last transaction)
const MOCK_LAST_ACTIVITY: Record<string, number> = {
  '12166': 14, '12185': 22, '121102': 38, '12177': 8,  '12120': 55,
  '12188': 91, '12154': 67, '121101': 5,  '121111': 45, '12140': 17,
  '12190': 33, '12196': 80, '12143': 120, '121108': 28, '121110': 95,
  '12412': 73, '12153': 44, '12157': 61,  '12186': 12,  '12199': 19,
};

export default function AgingReport() {
  const { t, lang } = useTranslation();

  const rows: AgingRow[] = useMemo(() =>
    clients
      .filter((c) => c.balance !== 0)
      .map((c) => {
        const days = MOCK_LAST_ACTIVITY[c.code] ?? 30;
        return {
          code: c.code,
          name: c.name,
          arabic: c.arabic,
          balance: c.balance,
          lastActivityDaysAgo: days,
          bucket: getBucket(days),
        };
      })
      .sort((a, b) => b.lastActivityDaysAgo - a.lastActivityDaysAgo),
  []);

  const bucketTotals = useMemo(() => {
    const totals: Record<Bucket, { count: number; balance: number }> = {
      '0-30': { count: 0, balance: 0 },
      '30-60': { count: 0, balance: 0 },
      '60-90': { count: 0, balance: 0 },
      '90+': { count: 0, balance: 0 },
    };
    rows.forEach((r) => {
      totals[r.bucket].count++;
      totals[r.bucket].balance += Math.abs(r.balance);
    });
    return totals;
  }, [rows]);

  const totalOutstanding = rows.reduce((s, r) => s + Math.abs(r.balance), 0);
  const overdueRows = rows.filter((r) => r.bucket === '60-90' || r.bucket === '90+');
  const criticalRows = rows.filter((r) => r.bucket === '90+');

  return (
    <div className="space-y-8">
      <PageHeader title={t('aging.title')} subtitle={t('aging.subtitle')} />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={lang === 'ar' ? 'إجمالي مستحق' : 'Total outstanding'} value={`$${totalOutstanding.toLocaleString()}`} icon={TrendingDown} accent="blue" />
        <StatCard label={t('aging.current')} value={bucketTotals['0-30'].count} icon={Users} accent="green" />
        <StatCard label={lang === 'ar' ? 'متأخر (60+ يوم)' : 'Overdue (60+ days)'} value={overdueRows.length} icon={AlertTriangle} accent="amber" />
        <StatCard label={lang === 'ar' ? 'حرج (+90 يوم)' : 'Critical (90+ days)'} value={criticalRows.length} icon={Clock} accent="pink" />
      </div>

      {/* Bucket summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(['0-30', '30-60', '60-90', '90+'] as Bucket[]).map((b) => {
          const pct = totalOutstanding > 0 ? (bucketTotals[b].balance / totalOutstanding) * 100 : 0;
          return (
            <SectionCard key={b} bodyClassName="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {b === '0-30' ? t('aging.current') : b === '30-60' ? t('aging.30to60') : b === '60-90' ? t('aging.60to90') : t('aging.over90')}
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">${bucketTotals[b].balance.toLocaleString()}</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full', BUCKET_BAR_COLOR[b])} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{bucketTotals[b].count} accounts</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <SectionCard title={lang === 'ar' ? 'تفاصيل الأرصدة المستحقة' : 'Outstanding Balance Detail'} padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>{t('field.name')}</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-32 text-center">{t('aging.col.days')}</TableHead>
                <TableHead className="w-28">{t('aging.col.bucket')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.code} className={r.bucket === '90+' ? 'bg-destructive/5' : undefined}>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{lang === 'ar' && r.arabic ? r.arabic : r.name}</p>
                      {r.arabic && lang !== 'ar' && <p className="text-xs text-muted-foreground">{r.arabic}</p>}
                    </div>
                  </TableCell>
                  <TableCell className={cn('text-right font-mono font-semibold tabular-nums', r.balance < 0 ? 'text-destructive' : 'text-foreground')}>
                    {r.balance < 0 ? '-' : ''}${Math.abs(r.balance).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="flex items-center justify-center gap-1 text-sm">
                      {r.bucket === '90+' && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {r.lastActivityDaysAgo}d
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold', BUCKET_COLOR[r.bucket])}>
                      {r.bucket}
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
