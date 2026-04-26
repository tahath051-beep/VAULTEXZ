import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getIBDashboard } from '@/api/ib.api';
import { fmt } from '@/lib/utils';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function IBDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['ib-dashboard'], queryFn: getIBDashboard });

  if (isLoading) return <PageLoader />;

  const m = data?.metrics;

  const metricCards = [
    {
      label: 'Total Commission Earned',
      value: `$${fmt(m?.total_commission ?? 0)}`,
      icon: DollarSign,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Pending Commission',
      value: `$${fmt(m?.pending_commission ?? 0)}`,
      icon: Clock,
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      valueColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Total Clients',
      value: String(m?.total_clients ?? 0),
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
    },
    {
      label: 'Active Clients (Month)',
      value: String(m?.active_clients_month ?? 0),
      icon: TrendingUp,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your IB performance overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${valueColor}`}>{value}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0 ml-2`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 7-day bar chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="font-semibold text-sm text-foreground">Commission — Last 7 Days</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.daily_stats ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(v) => `$${fmt(Number(v ?? 0))}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 clients */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="font-semibold text-sm text-foreground">Top 5 Clients by Volume</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {(data?.top_clients ?? []).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.client_code}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{c.total_volume} lots</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">${fmt(c.commission_generated)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-IBs */}
      {(data?.sub_ibs ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="font-semibold text-sm text-foreground">Sub-IBs</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {(data?.sub_ibs ?? []).map((ib) => (
                <div key={ib.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{ib.level_label}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ib.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{ib.ib_code} · {ib.clients} clients</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{ib.total_volume} lots</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">${fmt(ib.total_commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
