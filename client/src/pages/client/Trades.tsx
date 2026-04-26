import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getClientTrades, getClientAccounts } from '@/api/clientPortal.api';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { fmt, fmtDate } from '@/lib/utils';
import { Download } from 'lucide-react';

const LIMIT = 20;

export default function ClientTrades() {
  const { selectedMt5Id } = useClientAuthStore();
  const [offset, setOffset]   = useState(0);
  const [symbol, setSymbol]   = useState('ALL');
  const [direction, setDir]   = useState('ALL');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd]     = useState('');

  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });
  const selectedAccount = accounts.find((a) => a.id === selectedMt5Id) ?? accounts[0];

  const { data, isLoading } = useQuery({
    queryKey: ['client-trades', selectedMt5Id, symbol, direction, startDate, endDate, offset],
    queryFn: () => getClientTrades({
      mt5_login:  selectedAccount?.mt5_login,
      symbol:     symbol    === 'ALL' ? undefined : symbol,
      direction:  direction === 'ALL' ? undefined : direction,
      start_date: startDate || undefined,
      end_date:   endDate   || undefined,
      limit: LIMIT, offset,
    }),
    enabled: !!selectedAccount,
  });

  const reset = () => setOffset(0);

  const exportXLSX = () => {
    const rows = (data?.trades ?? []).map((t) => ({
      Ticket: t.ticket, 'MT5 Login': t.mt5_login, Symbol: t.symbol, Direction: t.direction,
      Volume: t.volume, 'Open Price': t.open_price, 'Close Price': t.close_price,
      'P&L (USD)': t.profit, Swap: t.swap, Commission: t.commission, 'Close Time': fmtDate(t.close_time),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    XLSX.writeFile(wb, `my-trades-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isLoading) return <PageLoader />;

  const trades = data?.trades ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Trades</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Closed trade history</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportXLSX}>
          <Download className="h-4 w-4 mr-2" />Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-wrap gap-3">
            <Select value={symbol} onValueChange={(v) => { setSymbol(v); reset(); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Symbols</SelectItem>
                {['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'USDCHF', 'AUDUSD'].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={direction} onValueChange={(v) => { setDir(v); reset(); }}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Dirs</SelectItem>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-40 h-9" value={startDate} onChange={(e) => { setStart(e.target.value); reset(); }} />
            <Input type="date" className="w-40 h-9" value={endDate}   onChange={(e) => { setEnd(e.target.value);   reset(); }} />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ticket</TableHead>
                  <TableHead className="w-24">Symbol</TableHead>
                  <TableHead className="w-20">Dir</TableHead>
                  <TableHead className="w-20">Volume</TableHead>
                  <TableHead className="w-28">Open</TableHead>
                  <TableHead className="w-28">Close</TableHead>
                  <TableHead className="w-28">P&amp;L</TableHead>
                  <TableHead className="w-24">Swap</TableHead>
                  <TableHead className="w-28">Commission</TableHead>
                  <TableHead className="w-32">Close Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.length ? trades.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket}</TableCell>
                    <TableCell className="font-semibold text-foreground">{t.symbol}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        t.direction === 'BUY'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>{t.direction}</span>
                    </TableCell>
                    <TableCell className="font-mono">{t.volume.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm">{t.open_price}</TableCell>
                    <TableCell className="font-mono text-sm">{t.close_price}</TableCell>
                    <TableCell className={`font-mono font-semibold ${t.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {t.profit >= 0 ? '+' : ''}${fmt(t.profit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">${fmt(t.swap)}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">${fmt(t.commission)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(t.close_time)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      No trades found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination offset={offset} limit={LIMIT} hasMore={trades.length === LIMIT} onChange={setOffset} />
        </CardContent>
      </Card>
    </div>
  );
}
