import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SectionCard } from '@/components/shared/SectionCard';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { getPnL, getBalanceSheet, getClientLedger, getReconciliation } from '@/api/reports.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { useWorkbookStore } from '@/stores/workbook.store';

const today = format(new Date(), 'yyyy-MM-dd');
const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

const LIMIT = 20;

function PnLTab() {
  const { t } = useTranslation();
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['pnl', start, end], queryFn: () => getPnL({ start_date: start, end_date: end }) });
  if (isLoading) return <PageLoader />;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const revRows = (data?.revenue ?? []).map((r) => ({ Account: r.account_name, Balance: r.balance }));
    const expRows = (data?.expenses ?? []).map((e) => ({ Account: e.account_name, Balance: e.balance }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revRows), 'Revenue');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), 'Expenses');
    XLSX.writeFile(wb, `PnL_${start}_to_${end}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="space-y-1"><Label>{t('filter.from')}</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="space-y-1"><Label>{t('filter.to')}</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <Button variant="outline" size="sm" onClick={handleExport} className="mb-0.5">{t('btn.export.excel')}</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('reports.pl.revenue'), value: data?.totalRevenue, color: 'text-success dark:text-green-400' },
          { label: t('reports.pl.expenses'), value: data?.totalExpenses, color: 'text-destructive dark:text-red-400' },
          { label: t('reports.pl.netProfit'), value: data?.netPnL, color: Number(data?.netPnL) >= 0 ? 'text-success dark:text-green-400' : 'text-destructive dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-elevated rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>${fmt(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title={t('reports.pl.revenue')} padded={false}>
          <Table>
            <TableHeader><TableRow><TableHead>{t('reports.tb.account')}</TableHead><TableHead>{t('col.balance')}</TableHead></TableRow></TableHeader>
            <TableBody>{data?.revenue?.map((r) => (<TableRow key={r.account_id}><TableCell>{r.account_name}</TableCell><TableCell className="font-mono text-success dark:text-green-400">${fmt(r.balance)}</TableCell></TableRow>))}</TableBody>
          </Table>
        </SectionCard>
        <SectionCard title={t('reports.pl.expenses')} padded={false}>
          <Table>
            <TableHeader><TableRow><TableHead>{t('reports.tb.account')}</TableHead><TableHead>{t('col.balance')}</TableHead></TableRow></TableHeader>
            <TableBody>{data?.expenses?.map((e) => (<TableRow key={e.account_id}><TableCell>{e.account_name}</TableCell><TableCell className="font-mono text-destructive dark:text-red-400">${fmt(e.balance)}</TableCell></TableRow>))}</TableBody>
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}

function BalanceSheetTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['balance-sheet'], queryFn: () => getBalanceSheet({}) });
  if (isLoading) return <PageLoader />;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const assetRows = (data?.assets ?? []).map((r) => ({ Account: r.account_name, Balance: r.balance }));
    const liabRows = (data?.liabilities ?? []).map((r) => ({ Account: r.account_name, Balance: r.balance }));
    const eqRows = (data?.equity ?? []).map((r) => ({ Account: r.account_name, Balance: r.balance }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetRows), 'Assets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liabRows), 'Liabilities');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eqRows), 'Equity');
    XLSX.writeFile(wb, `BalanceSheet_${today}.xlsx`);
  };

  const sectionTitles = {
    assets: t('reports.bs.assets'),
    liabilities: t('reports.bs.liabilities'),
    equity: t('reports.bs.equity'),
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>{t('btn.export.excel')}</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('reports.bs.assets'),      value: data?.totalAssets,      color: 'text-primary' },
          { label: t('reports.bs.liabilities'), value: data?.totalLiabilities, color: 'text-warning dark:text-amber-400' },
          { label: t('reports.bs.equity'),      value: data?.totalEquity,      color: 'text-success dark:text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-elevated rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>${fmt(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {(['assets', 'liabilities', 'equity'] as const).map((key) => (
          <SectionCard key={key} title={sectionTitles[key]} padded={false}>
            <Table>
              <TableHeader><TableRow><TableHead>{t('reports.tb.account')}</TableHead><TableHead>{t('col.balance')}</TableHead></TableRow></TableHeader>
              <TableBody>{data?.[key]?.map((r) => (<TableRow key={r.account_id}><TableCell className="text-sm">{r.account_name}</TableCell><TableCell className="font-mono text-sm">${fmt(r.balance)}</TableCell></TableRow>))}</TableBody>
            </Table>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function LedgerTab() {
  const [offset, setOffset] = useState(0);
  const [start, setStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [end, setEnd] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['ledger', offset, start, end], queryFn: () => getClientLedger({ limit: LIMIT, offset, start_date: start, end_date: end }) });
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="space-y-1"><Label>From</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="space-y-1"><Label>To</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <SectionCard padded={false}>
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>MT5</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Balance After</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.entries?.length ? data.entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.client_name ?? '-'}</TableCell>
                  <TableCell className="font-mono">{e.mt5_login ?? '-'}</TableCell>
                  <TableCell>{e.entry_type}</TableCell>
                  <TableCell className={`font-mono ${['DEPOSIT','CREDIT'].includes(e.entry_type) ? 'text-success dark:text-green-400' : 'text-destructive dark:text-red-400'}`}>${fmt(e.amount)} {e.currency}</TableCell>
                  <TableCell className="font-mono">${fmt(e.balance_after)}</TableCell>
                  <TableCell>{fmtDateTime(e.created_at)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No entries</TableCell></TableRow>}
            </TableBody>
          </Table>
          <Pagination offset={offset} limit={LIMIT} hasMore={(data?.entries?.length ?? 0) === LIMIT} onChange={setOffset} />
      </SectionCard>
    </div>
  );
}

function ReconciliationTab() {
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['recon', start, end], queryFn: () => getReconciliation({ start_date: start, end_date: end }) });
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="space-y-1"><Label>From</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="space-y-1"><Label>To</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <SectionCard padded={false}>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Resolved By</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.records?.length ? data.records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.recon_date)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>{r.resolved_by_name ?? '-'}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{r.notes ?? '-'}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>}
            </TableBody>
          </Table>
      </SectionCard>
    </div>
  );
}

function TrialBalanceTab() {
  const { t } = useTranslation();
  const accounts = useWorkbookStore((s) => s.accounts);

  const rows = accounts.map((a) => ({
    code: a.code,
    name: a.name,
    category: a.category,
    debit: a.balance > 0 ? a.balance : 0,
    credit: a.balance < 0 ? Math.abs(a.balance) : 0,
  }));

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const sheetRows = rows.map((r) => ({
      'Account Code': r.code,
      'Account Name': r.name,
      'Category': r.category,
      'Debit': r.debit,
      'Credit': r.credit,
    }));
    sheetRows.push({
      'Account Code': '',
      'Account Name': 'TOTAL',
      'Category': '',
      'Debit': totalDebit,
      'Credit': totalCredit,
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Trial Balance');
    XLSX.writeFile(wb, `TrialBalance_${today}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {balanced ? (
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="text-base">✓</span> Accounts are balanced
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <span className="text-base">✗</span> Accounts are NOT balanced (difference: ${Math.abs(totalDebit - totalCredit).toLocaleString()})
              </span>
            )}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>{t('btn.export.excel')}</Button>
      </div>

      <SectionCard padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('col.code')}</TableHead>
                <TableHead>{t('reports.tb.account')}</TableHead>
                <TableHead className="w-28">{t('col.category')}</TableHead>
                <TableHead className="w-32 text-right">{t('reports.tb.debit')}</TableHead>
                <TableHead className="w-32 text-right">{t('reports.tb.credit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.code}>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</TableCell>
                  <TableCell className="text-sm">{r.name}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">{r.category}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-success">
                    {r.debit > 0 ? `$${r.debit.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-destructive">
                    {r.credit > 0 ? `$${r.credit.toLocaleString()}` : '—'}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals row */}
              <TableRow className="border-t-2 border-border bg-muted/30 font-bold">
                <TableCell colSpan={3} className="text-sm font-bold">
                  <div className="flex items-center gap-2">
                    {t('report.total')}
                    {balanced
                      ? <span className="text-success text-base">✓</span>
                      : <span className="text-destructive text-base">✗</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-bold tabular-nums text-success">
                  ${totalDebit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono font-bold tabular-nums text-destructive">
                  ${totalCredit.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        hint={
          <PageHint id="reports" title={t('hint.reports.title')}>
            {t('hint.reports.body')}
          </PageHint>
        }
      />
      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl">{t('reports.tab.pl')}</TabsTrigger>
          <TabsTrigger value="bs">{t('reports.tab.bs')}</TabsTrigger>
          <TabsTrigger value="ledger">Client Ledger</TabsTrigger>
          <TabsTrigger value="recon">Reconciliation</TabsTrigger>
          <TabsTrigger value="trial">{t('reports.tab.tb')}</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="mt-4"><PnLTab /></TabsContent>
        <TabsContent value="bs" className="mt-4"><BalanceSheetTab /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><LedgerTab /></TabsContent>
        <TabsContent value="recon" className="mt-4"><ReconciliationTab /></TabsContent>
        <TabsContent value="trial" className="mt-4"><TrialBalanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}
