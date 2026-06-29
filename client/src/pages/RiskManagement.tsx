import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskApi } from '@/api/risk.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';

function ExposureTab() {
  const { data } = useQuery({ queryKey: ['risk-latest'], queryFn: () => riskApi.getLatestSnapshot() });
  const snapshots = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Symbol','Buy Lots','Sell Lots','Net Exposure','A-Book Buy','A-Book Sell','B-Book Buy','B-Book Sell','Floating P/L'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {snapshots.map((s) => {
            const net = parseFloat(s.net_exposure_lots || '0');
            return (
              <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2.5 font-mono font-semibold">{s.symbol}</td>
                <td className="px-4 py-2.5 text-green-400">{s.total_buy_lots}</td>
                <td className="px-4 py-2.5 text-red-400">{s.total_sell_lots}</td>
                <td className={`px-4 py-2.5 font-bold ${net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : ''}`}>{net.toFixed(2)}</td>
                <td className="px-4 py-2.5">{s.abook_buy_lots}</td>
                <td className="px-4 py-2.5">{s.abook_sell_lots}</td>
                <td className="px-4 py-2.5">{s.bbook_buy_lots}</td>
                <td className="px-4 py-2.5">{s.bbook_sell_lots}</td>
                <td className={`px-4 py-2.5 font-semibold ${parseFloat(s.floating_pnl||'0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(s.floating_pnl||'0').toLocaleString()}
                </td>
              </tr>
            );
          })}
          {snapshots.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No exposure data — run EOD to generate snapshots</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ['risk-alerts'], queryFn: () => riskApi.getAlerts() });
  const ack = useMutation({
    mutationFn: (id: string) => riskApi.acknowledgeAlert(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risk-alerts'] }); toast({ title: 'Alert acknowledged' }); },
  });

  const alerts = (data?.data?.data ?? []) as Record<string, string>[];
  const unacked = alerts.filter(a => !a.is_acknowledged);

  return (
    <div className="space-y-4">
      {unacked.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          {unacked.length} unacknowledged alert{unacked.length > 1 ? 's' : ''}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Type','Symbol','Current','Limit','Severity','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{a.alert_type?.replace(/_/g,' ')}</td>
                <td className="px-4 py-2.5 font-mono">{a.symbol ?? 'ALL'}</td>
                <td className="px-4 py-2.5">{parseFloat(a.current_value||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5">{parseFloat(a.limit_value||'0').toLocaleString()}</td>
                <td className={`px-4 py-2.5 font-semibold ${a.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>{a.severity}</td>
                <td className="px-4 py-2.5">{a.is_acknowledged ? <span className="text-green-400">Acknowledged</span> : <span className="text-amber-400">Open</span>}</td>
                <td className="px-4 py-2.5">
                  {!a.is_acknowledged && (
                    <Button size="sm" variant="outline" onClick={() => ack.mutate(a.id)}>Acknowledge</Button>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No risk alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoverageTab() {
  const { data } = useQuery({ queryKey: ['coverage'], queryFn: () => riskApi.getCoverage({ status: 'OPEN' }) });
  const records = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Symbol','Type','Direction','Lots','Open Price','LP','Status'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-muted/20">
              <td className="px-4 py-2.5 font-mono font-semibold">{r.symbol}</td>
              <td className="px-4 py-2.5">{r.coverage_type}</td>
              <td className={`px-4 py-2.5 font-semibold ${r.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{r.direction}</td>
              <td className="px-4 py-2.5">{r.lots}</td>
              <td className="px-4 py-2.5 font-mono">{r.open_price}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.lp_name ?? '—'}</td>
              <td className="px-4 py-2.5 text-green-400">{r.status}</td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No open coverage positions</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function RiskManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Risk Management" subtitle="Exposure monitoring, coverage, and alerts" icon={<ShieldAlert className="h-5 w-5" />} />
      <Tabs defaultValue="exposure">
        <TabsList>
          <TabsTrigger value="exposure"><TrendingUp className="h-3.5 w-3.5 me-1.5" />Exposure</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="h-3.5 w-3.5 me-1.5" />Alerts</TabsTrigger>
          <TabsTrigger value="coverage"><ShieldAlert className="h-3.5 w-3.5 me-1.5" />Coverage</TabsTrigger>
        </TabsList>
        <TabsContent value="exposure" className="mt-4"><ExposureTab /></TabsContent>
        <TabsContent value="alerts" className="mt-4"><AlertsTab /></TabsContent>
        <TabsContent value="coverage" className="mt-4"><CoverageTab /></TabsContent>
      </Tabs>
    </div>
  );
}
