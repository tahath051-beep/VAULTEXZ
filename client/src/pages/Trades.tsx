import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/shared/Pagination';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getTrades, getTrade } from '@/api/trades.api';
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils';
import { Download, CheckCircle2, Clock } from 'lucide-react';

const LIMIT = 20;

const bookBadge = (book: string) =>
  book === 'A'
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';

export default function Trades() {
  const [offset, setOffset]       = useState(0);
  const [ticket, setTicket]       = useState('');
  const [symbol, setSymbol]       = useState('ALL');
  const [bookType, setBookType]   = useState('ALL');
  const [posted, setPosted]       = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reset = () => { setOffset(0); };

  const { data, isLoading } = useQuery({
    queryKey: ['trades', offset, ticket, symbol, bookType, posted, startDate, endDate],
    queryFn: () => getTrades({
      limit: LIMIT, offset,
      ticket: ticket || undefined,
      symbol: symbol === 'ALL' ? undefined : symbol,
      book_type: bookType === 'ALL' ? undefined : bookType,
      journal_posted: posted === 'ALL' ? undefined : posted === 'true',
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['trade-detail', selectedId],
    queryFn: () => getTrade(selectedId!),
    enabled: !!selectedId,
  });

  const exportXLSX = () => {
    const rows = (data?.trades ?? []).map((t) => ({
      Ticket:          t.ticket,
      Client:          t.client_name ?? '',
      'Client Code':   t.client_code ?? '',
      'MT5 Login':     t.mt5_login ?? '',
      Symbol:          t.symbol,
      Direction:       t.direction,
      Volume:          t.volume,
      'Open Price':    t.open_price,
      'Close Price':   t.close_price,
      'MT5 Profit':    t.profit,
      'Spread Income': t.spread_income,
      Book:            t.book_type + '-Book',
      'Journal Posted': t.journal_posted ? 'Yes' : 'No',
      'Close Time':    fmtDate(t.close_time),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    XLSX.writeFile(wb, `trades-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isLoading) return <PageLoader />;

  const trades  = data?.trades  ?? [];
  const totals  = data?.totals;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trades"
        subtitle="Closed trade history with journal status"
        actions={
          <Button variant="outline" onClick={exportXLSX}>
            <Download className="h-4 w-4 mr-2" />Export Excel
          </Button>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-5">
            <Input
              className="w-32"
              placeholder="Ticket #"
              value={ticket}
              onChange={(e) => { setTicket(e.target.value); reset(); }}
            />
            <Select value={symbol} onValueChange={(v) => { setSymbol(v); reset(); }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Symbols</SelectItem>
                {['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'USDCHF', 'AUDUSD'].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bookType} onValueChange={(v) => { setBookType(v); reset(); }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Books</SelectItem>
                <SelectItem value="A">A-Book</SelectItem>
                <SelectItem value="B">B-Book</SelectItem>
              </SelectContent>
            </Select>
            <Select value={posted} onValueChange={(v) => { setPosted(v); reset(); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Journal</SelectItem>
                <SelectItem value="true">Posted</SelectItem>
                <SelectItem value="false">Not Posted</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-40" value={startDate} onChange={(e) => { setStartDate(e.target.value); reset(); }} />
            <Input type="date" className="w-40" value={endDate} onChange={(e) => { setEndDate(e.target.value); reset(); }} />
          </div>
        </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Ticket</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-24">Symbol</TableHead>
                <TableHead className="w-20">Dir</TableHead>
                <TableHead className="w-20">Volume</TableHead>
                <TableHead className="w-28">Open</TableHead>
                <TableHead className="w-28">Close</TableHead>
                <TableHead className="w-28">MT5 P&amp;L</TableHead>
                <TableHead className="w-28">Spread Inc.</TableHead>
                <TableHead className="w-20">Book</TableHead>
                <TableHead className="w-24">Journal</TableHead>
                <TableHead className="w-28">Close Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length ? trades.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(t.id)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{t.client_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.client_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{t.symbol}</TableCell>
                  <TableCell>
                    <span className={t.direction === 'BUY' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {t.direction}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{t.volume.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm">{t.open_price}</TableCell>
                  <TableCell className="font-mono text-sm">{t.close_price}</TableCell>
                  <TableCell className={`font-mono font-semibold ${Number(t.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${fmt(t.profit)}
                  </TableCell>
                  <TableCell className="font-mono text-green-700 dark:text-green-400">
                    ${fmt(t.spread_income)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${bookBadge(t.book_type)}`}>
                      {t.book_type}-Book
                    </span>
                  </TableCell>
                  <TableCell>
                    {t.journal_posted
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <Clock className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(t.close_time)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                    No trades found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Summary bar */}
          {totals && (
            <div className="border-t bg-muted/30 px-4 py-3 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Volume: </span>
                <span className="font-semibold">{fmt(totals.volume)} lots</span>
              </div>
              <div>
                <span className="text-muted-foreground">Spread Income: </span>
                <span className="font-semibold text-green-700 dark:text-green-400">${fmt(totals.spread_income)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">B-Book P&amp;L: </span>
                <span className={`font-semibold ${totals.b_book_pl >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                  ${fmt(totals.b_book_pl)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Net Broker P&amp;L: </span>
                <span className={`font-semibold ${totals.net_broker_pl >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                  ${fmt(totals.net_broker_pl)}
                </span>
              </div>
            </div>
          )}

          <Pagination
            offset={offset}
            limit={LIMIT}
            hasMore={trades.length === LIMIT}
            onChange={setOffset}
          />
      </SectionCard>

      {/* Trade Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Trade Detail {detail ? `— #${detail.ticket}` : ''}
            </DialogTitle>
          </DialogHeader>

          {detailLoading || !detail ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-5">
              {/* Trade info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Row label="Client"    value={`${detail.client_name} (${detail.client_code})`} />
                <Row label="MT5 Login" value={String(detail.mt5_login ?? '—')} mono />
                <Row label="Symbol"    value={detail.symbol} />
                <Row label="Direction" value={detail.direction}
                  valueClass={detail.direction === 'BUY' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} />
                <Row label="Volume"    value={detail.volume.toFixed(2) + ' lots'} />
                <Row label="Book Type" value={detail.book_type + '-Book'} />
                <Row label="Open Price"  value={String(detail.open_price)} mono />
                <Row label="Close Price" value={String(detail.close_price)} mono />
                <Row label="MT5 Profit"
                  value={'$' + fmt(detail.profit)}
                  valueClass={detail.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} />
                <Row label="Spread Income" value={'$' + fmt(detail.spread_income)}
                  valueClass="text-green-700 dark:text-green-400 font-semibold" />
                <Row label="Swap"       value={'$' + fmt(detail.swap)} />
                <Row label="Commission" value={'$' + fmt(detail.commission)} />
                <Row label="Close Time" value={fmtDateTime(detail.close_time)} />
                <Row label="Journal"    value={detail.journal_posted ? 'Posted' : 'Pending'}
                  valueClass={detail.journal_posted ? 'text-green-600' : 'text-muted-foreground'} />
              </div>

              {/* Linked journal entries */}
              {detail.journals.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-3">Linked Journal Entries</p>
                    <div className="space-y-3">
                      {detail.journals.map((j) => (
                        <div key={j.id} className="border rounded-md p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs text-muted-foreground">{j.id}</span>
                            <Badge variant="success" className="text-xs">Posted</Badge>
                          </div>
                          <p className="text-muted-foreground text-xs mb-2">{j.narration}</p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left pb-1">Account</th>
                                <th className="text-right pb-1">Debit</th>
                                <th className="text-right pb-1">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {j.lines.map((l, i) => (
                                <tr key={i}>
                                  <td className="py-0.5">{l.account_code} {l.account_name}</td>
                                  <td className="text-right font-mono">{Number(l.debit) ? '$' + fmt(l.debit) : '—'}</td>
                                  <td className="text-right font-mono">{Number(l.credit) ? '$' + fmt(l.credit) : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Linked IB commissions */}
              {detail.commissions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-3">IB Commissions Generated</p>
                    <div className="space-y-2">
                      {detail.commissions.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                          <div>
                            <span className="font-medium">{c.ib_name ?? '—'}</span>
                            <span className="text-muted-foreground font-mono text-xs ml-2">{c.ib_code}</span>
                            {c.ib_level && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted">{c.ib_level}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">${fmt(c.amount)}</span>
                            <Badge variant={c.status === 'PAID' ? 'success' : 'secondary'} className="text-xs">
                              {c.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label, value, mono, valueClass,
}: {
  label: string; value: string; mono?: boolean; valueClass?: string;
}) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${valueClass ?? ''}`}>{value}</span>
    </>
  );
}
