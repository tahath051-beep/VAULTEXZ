import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { getPnL, getBalanceSheet, getClientLedger, getReconciliation } from '@/api/reports.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { format, subDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

const LIMIT = 20;

function PnLTab() {
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['pnl', start, end], queryFn: () => getPnL({ start_date: start, end_date: end }) });
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="space-y-1"><Label>From</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="space-y-1"><Label>To</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: data?.totalRevenue, color: 'text-green-600' },
          { label: 'Total Expenses', value: data?.totalExpenses, color: 'text-red-600' },
          { label: 'Net P&L', value: data?.netPnL, color: Number(data?.netPnL) >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${color}`}>${fmt(value)}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
              <TableBody>{data?.revenue?.map((r) => (<TableRow key={r.account_id}><TableCell>{r.account_name}</TableCell><TableCell className="font-mono text-green-600">${fmt(r.balance)}</TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Expenses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
              <TableBody>{data?.expenses?.map((e) => (<TableRow key={e.account_id}><TableCell>{e.account_name}</TableCell><TableCell className="font-mono text-red-600">${fmt(e.balance)}</TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BalanceSheetTab() {
  const { data, isLoading } = useQuery({ queryKey: ['balance-sheet'], queryFn: () => getBalanceSheet({}) });
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assets', value: data?.totalAssets, color: 'text-blue-600' },
          { label: 'Total Liabilities', value: data?.totalLiabilities, color: 'text-orange-600' },
          { label: 'Total Equity', value: data?.totalEquity, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${color}`}>${fmt(value)}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {(['assets', 'liabilities', 'equity'] as const).map((key) => (
          <Card key={key}>
            <CardHeader><CardTitle className="text-sm capitalize">{key}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
                <TableBody>{data?.[key]?.map((r) => (<TableRow key={r.account_id}><TableCell className="text-sm">{r.account_name}</TableCell><TableCell className="font-mono text-sm">${fmt(r.balance)}</TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
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
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>MT5</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Balance After</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.entries?.length ? data.entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.client_name ?? '-'}</TableCell>
                  <TableCell className="font-mono">{e.mt5_login ?? '-'}</TableCell>
                  <TableCell>{e.entry_type}</TableCell>
                  <TableCell className={`font-mono ${['DEPOSIT','CREDIT'].includes(e.entry_type) ? 'text-green-600' : 'text-red-600'}`}>${fmt(e.amount)} {e.currency}</TableCell>
                  <TableCell className="font-mono">${fmt(e.balance_after)}</TableCell>
                  <TableCell>{fmtDateTime(e.created_at)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No entries</TableCell></TableRow>}
            </TableBody>
          </Table>
          <Pagination offset={offset} limit={LIMIT} hasMore={(data?.entries?.length ?? 0) === LIMIT} onChange={setOffset} />
        </CardContent>
      </Card>
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
      <Card>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Financial statements and ledger history</p>
      </div>
      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl">P&L Statement</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="ledger">Client Ledger</TabsTrigger>
          <TabsTrigger value="recon">Reconciliation</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="mt-4"><PnLTab /></TabsContent>
        <TabsContent value="bs" className="mt-4"><BalanceSheetTab /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><LedgerTab /></TabsContent>
        <TabsContent value="recon" className="mt-4"><ReconciliationTab /></TabsContent>
      </Tabs>
    </div>
  );
}
