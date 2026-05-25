import { useMemo, useState } from 'react';
import { Search, Filter, Download, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type EntryRow, type OpType } from '@/lib/workbook';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { downloadCSV } from '@/lib/csv';
import { toast } from '@/hooks/use-toast';
import { AddEntryButton } from '@/components/shared/AddRowModals';
import { cn } from '@/lib/utils';

const opIcon: Record<OpType, typeof ArrowDownLeft> = {
  'تعزيز':      ArrowDownLeft,
  'سحب':        ArrowUpRight,
  'تحويل من':   ArrowLeftRight,
  'تحويل الى':  ArrowLeftRight,
};

const opColor: Record<OpType, 'success' | 'destructive' | 'warning' | 'info'> = {
  'تعزيز':     'success',
  'سحب':       'destructive',
  'تحويل من':  'warning',
  'تحويل الى': 'info',
};

const opLabelKey: Record<OpType, 'entries.op.deposit' | 'entries.op.withdraw' | 'entries.op.transferFrom' | 'entries.op.transferTo'> = {
  'تعزيز':     'entries.op.deposit',
  'سحب':       'entries.op.withdraw',
  'تحويل من':  'entries.op.transferFrom',
  'تحويل الى': 'entries.op.transferTo',
};

const fmtNum = (n: number) =>
  n === 0 ? '' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Entries() {
  const { t } = useTranslation();
  const entries = useWorkbookStore((s) => s.entries);
  const [search, setSearch] = useState('');
  const [opFilter, setOpFilter] = useState<OpType | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (opFilter !== 'ALL' && e.opType !== opFilter) return false;
      if (!q) return true;
      return (
        e.account.toLowerCase().includes(q) ||
        e.counterAccount.toLowerCase().includes(q) ||
        e.note?.toLowerCase().includes(q) ||
        String(e.ticket).includes(q)
      );
    });
  }, [search, opFilter, entries]);

  const sumDebit  = filtered.reduce((acc, r) => acc + r.debit, 0);
  const sumCredit = filtered.reduce((acc, r) => acc + r.credit, 0);

  const grouped: { ticket: number; rows: EntryRow[] }[] = [];
  for (const row of filtered) {
    const last = grouped[grouped.length - 1];
    if (last && last.ticket === row.ticket) last.rows.push(row);
    else grouped.push({ ticket: row.ticket, rows: [row] });
  }

  const handleExport = () => {
    downloadCSV(
      `entries-${new Date().toISOString().slice(0, 10)}`,
      ['#', t('entries.col.date'), t('entries.col.op'), t('entries.col.account'), t('entries.col.counter'), t('entries.col.curr'), t('entries.col.debit'), t('entries.col.credit'), t('entries.col.note')],
      filtered.map((r) => [r.ticket, r.date, t(opLabelKey[r.opType]), r.account, r.counterAccount, r.currency, r.debit || '', r.credit || '', r.note ?? '']),
    );
    toast({ title: t('toast.exported'), description: `${filtered.length} rows` });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('entries.title')}
        subtitle="Raw accounting entries — the individual debits and credits"
        hint={
          <PageHint id="entries" title="What is this page?">
            Entries are the line-level building blocks of Journal Entries. Each entry is a single debit or credit to one account. Multiple entries combine to form a balanced journal entry.
          </PageHint>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> {t('action.export')}
            </Button>
            <AddEntryButton />
          </>
        }
      />

      <SectionCard
        title={t('entries.filter')}
        action={
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">{t('entries.debitTotal')}</span>
            <span className="font-semibold tabular-nums text-success">${fmtNum(sumDebit)}</span>
            <span className="text-muted-foreground">{t('entries.creditTotal')}</span>
            <span className="font-semibold tabular-nums text-destructive">${fmtNum(sumCredit)}</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('entries.searchPh')}
              className="ps-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
            <Filter className="ms-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => setOpFilter('ALL')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                opFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
              )}
            >
              {t('action.all')}
            </button>
            {(['تعزيز', 'سحب', 'تحويل من', 'تحويل الى'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOpFilter(op)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  opFilter === op
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
              >
                {t(opLabelKey[op])}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead className="w-28">{t('entries.col.date')}</TableHead>
                <TableHead className="w-32">{t('entries.col.op')}</TableHead>
                <TableHead>{t('entries.col.account')}</TableHead>
                <TableHead>{t('entries.col.counter')}</TableHead>
                <TableHead className="w-16">{t('entries.col.curr')}</TableHead>
                <TableHead className="w-32 text-end">{t('entries.col.debit')}</TableHead>
                <TableHead className="w-32 text-end">{t('entries.col.credit')}</TableHead>
                <TableHead className="min-w-[180px]">{t('entries.col.note')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map(({ ticket, rows }, gi) => (
                rows.map((r, idx) => {
                  const OpIcon = opIcon[r.opType];
                  const variant = opColor[r.opType];
                  return (
                    <TableRow
                      key={`${ticket}-${idx}`}
                      className={cn(
                        gi % 2 === 1 && 'bg-muted/30',
                        idx === 0 && 'border-t-2 border-t-border/60',
                      )}
                    >
                      {idx === 0 ? (
                        <TableCell rowSpan={rows.length} className="align-top font-mono text-xs font-semibold text-primary">
                          {ticket}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {r.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant} className="gap-1">
                          <OpIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{t(opLabelKey[r.opType])}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{r.account}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.counterAccount}</TableCell>
                      <TableCell>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                          {r.currency}
                        </span>
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold text-success">
                        {fmtNum(r.debit)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold text-destructive">
                        {fmtNum(r.credit)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.note}</TableCell>
                    </TableRow>
                  );
                })
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    {t('entries.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
