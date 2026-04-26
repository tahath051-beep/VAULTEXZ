import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { fmt, fmtDate } from '@/lib/utils';
import { getPnL } from '@/api/reports.api';
import { getPayments } from '@/api/payments.api';
import { getEODStatus } from '@/api/eod.api';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Clock } from 'lucide-react';

const today = format(new Date(), 'yyyy-MM-dd');
const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

export default function Dashboard() {
  const { data: pnl, isLoading: pnlLoading } = useQuery({
    queryKey: ['pnl', monthStart, today],
    queryFn: () => getPnL({ start_date: monthStart, end_date: today }),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ['payments', 'PENDING'],
    queryFn: () => getPayments({ status: 'PENDING', limit: 5 }),
  });

  const { data: eodStatus } = useQuery({
    queryKey: ['eod-status', today],
    queryFn: () => getEODStatus(today),
    retry: false,
  });

  if (pnlLoading) return <PageLoader />;

  const stats = [
    { title: 'Net P&L (MTD)', value: `$${fmt(pnl?.netPnL)}`, icon: TrendingUp, color: Number(pnl?.netPnL) >= 0 ? 'text-green-600' : 'text-red-600' },
    { title: 'Total Revenue (MTD)', value: `$${fmt(pnl?.totalRevenue)}`, icon: DollarSign, color: 'text-blue-600' },
    { title: 'Total Expenses (MTD)', value: `$${fmt(pnl?.totalExpenses)}`, icon: DollarSign, color: 'text-orange-600' },
    { title: 'Pending Payments', value: String(pendingPayments?.payments?.length ?? 0), icon: CreditCard, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview for {fmtDate(today)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Expenses (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: 'Revenue', value: Number(pnl?.totalRevenue ?? 0) },
                { name: 'Expenses', value: Number(pnl?.totalExpenses ?? 0) },
                { name: 'Net P&L', value: Number(pnl?.netPnL ?? 0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `$${fmt(v as number)}`} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">EOD Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eodStatus ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{fmtDate(eodStatus.eod_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{eodStatus.status}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Records</span><span>{eodStatus.records_processed ?? '-'}</span></div>
                {eodStatus.error_message && (
                  <div className="text-destructive text-xs mt-2">{eodStatus.error_message}</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No EOD run today yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pending Payments</CardTitle></CardHeader>
        <CardContent>
          {pendingPayments?.payments?.length ? (
            <div className="space-y-2">
              {pendingPayments.payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{p.client_name ?? '-'}</span>
                    <span className="text-muted-foreground ml-2">{p.payment_type}</span>
                  </div>
                  <span className="font-semibold">${fmt(p.amount)} {p.currency}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending payments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
