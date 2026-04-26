import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getClientAccounts, getClientStatement, type ClientAccount } from '@/api/clientPortal.api';
import { fmt, fmtDate } from '@/lib/utils';
import { FileText, Download, Printer } from 'lucide-react';

const PRESETS = [
  { label: 'This Month',    start: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); },          end: () => new Date().toISOString().slice(0, 10) },
  { label: 'Last Month',   start: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10); },       end: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10); } },
  { label: 'Last 3 Months', start: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10); },                    end: () => new Date().toISOString().slice(0, 10) },
  { label: 'This Year',    start: () => `${new Date().getFullYear()}-01-01`,                                                                               end: () => new Date().toISOString().slice(0, 10) },
];

export default function ClientStatements() {
  const today       = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const [startDate, setStart]   = useState(firstOfMonth);
  const [endDate, setEnd]       = useState(today);
  const [acctId, setAcctId]     = useState('');
  const [generate, setGenerate] = useState(false);

  const { data: accounts, isLoading: acctLoading } = useQuery({
    queryKey: ['client-accounts'],
    queryFn: getClientAccounts,
  });

  const acctList: ClientAccount[] = accounts ?? [];
  const selectedAcct = acctList.find((a) => a.id === (acctId || acctList[0]?.id)) ?? acctList[0];

  const { data: statement, isFetching } = useQuery({
    queryKey: ['client-statement', selectedAcct?.mt5_login, startDate, endDate],
    queryFn: () => getClientStatement(selectedAcct!.mt5_login, startDate, endDate),
    enabled: generate && !!selectedAcct,
  });

  const applyPreset = (p: typeof PRESETS[0]) => {
    setStart(p.start()); setEnd(p.end()); setGenerate(false);
  };

  const exportXLSX = () => {
    if (!statement) return;
    const txnRows   = statement.transactions.map((t) => ({ Date: fmtDate(t.date), Type: t.type, Amount: t.amount_usd, Currency: t.currency, Status: t.status, Gateway: t.gateway, Reference: t.reference }));
    const tradeRows = statement.trades.map((t) => ({ Ticket: t.ticket, Symbol: t.symbol, Direction: t.direction, Volume: t.volume, 'P&L': t.profit, 'Close Time': fmtDate(t.close_time) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txnRows),   'Transactions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tradeRows), 'Trades');
    XLSX.writeFile(wb, `statement-${selectedAcct?.mt5_login}-${startDate}-${endDate}.xlsx`);
  };

  if (acctLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Generate account statements for any period</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Account</Label>
              <Select value={acctId || acctList[0]?.id} onValueChange={(v) => { setAcctId(v); setGenerate(false); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {acctList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.mt5_login} · {a.account_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" className="h-9" value={startDate} onChange={(e) => { setStart(e.target.value); setGenerate(false); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="date" className="h-9" value={endDate} onChange={(e) => { setEnd(e.target.value); setGenerate(false); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs invisible">Action</Label>
              <Button className="w-full h-9" onClick={() => setGenerate(true)}>
                <FileText className="h-4 w-4 mr-2" />Generate
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Quick:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-primary hover:bg-primary/10 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isFetching && (
        <div className="text-center py-12 text-muted-foreground">Generating statement...</div>
      )}

      {/* Statement preview */}
      {generate && !isFetching && statement && (
        <Card id="statement-print">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Account Statement</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {statement.account.mt5_login} · {statement.account.account_type} ·{' '}
                  {fmtDate(statement.period.start)} → {fmtDate(statement.period.end)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />Print
                </Button>
                <Button variant="outline" size="sm" onClick={exportXLSX}>
                  <Download className="h-4 w-4 mr-2" />Excel
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Opening Balance', value: `$${fmt(statement.opening_balance)}`,                         color: 'text-foreground' },
                { label: 'Closing Balance', value: `$${fmt(statement.closing_balance)}`,                         color: 'text-foreground font-bold' },
                { label: 'Total P&L',       value: `${statement.total_pnl >= 0 ? '+' : ''}$${fmt(statement.total_pnl)}`, color: statement.total_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive' },
                { label: 'Trades',          value: String(statement.trade_count),                                color: 'text-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-base font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Transactions */}
            {statement.transactions.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Transactions</p>
                  <div className="space-y-2">
                    {statement.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mr-2 ${
                            t.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          }`}>{t.type}</span>
                          <span className="text-sm text-muted-foreground">{t.narration}</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {t.type === 'DEPOSIT' ? '+' : '-'}${fmt(t.amount_usd)}
                          </p>
                          <p className="text-xs text-muted-foreground">{fmtDate(t.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Trades */}
            {statement.trades.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Trades ({statement.trade_count})</p>
                  <div className="space-y-2">
                    {statement.trades.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">#{t.ticket}</span>
                          <span className="font-semibold text-sm text-foreground">{t.symbol}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            t.direction === 'BUY' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>{t.direction}</span>
                          <span className="text-xs text-muted-foreground">{t.volume} lots</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${t.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                            {t.profit >= 0 ? '+' : ''}${fmt(t.profit)}
                          </p>
                          <p className="text-xs text-muted-foreground">{fmtDate(t.close_time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {generate && !isFetching && !statement && (
        <div className="text-center py-12 text-muted-foreground">No data for selected period</div>
      )}
    </div>
  );
}
