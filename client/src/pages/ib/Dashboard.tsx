import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getIBDashboard } from '@/api/ib.api';
import { fmt } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function IBDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['ib-dashboard'], queryFn: getIBDashboard });

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'Bank Transfer' | 'Crypto' | 'Internal'>('Bank Transfer');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutError, setPayoutError] = useState('');

  if (isLoading) return <PageLoader />;

  const m = data?.metrics;
  const pendingCommission = m?.pending_commission ?? 0;

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!payoutAmount || isNaN(amount) || amount <= 0) {
      setPayoutError('Please enter a valid amount greater than 0.');
      return;
    }
    if (amount > pendingCommission) {
      setPayoutError(`Amount cannot exceed pending commission ($${fmt(pendingCommission)}).`);
      return;
    }
    setPayoutError('');
    toast({ title: `Payout request submitted for $${fmt(amount)} via ${payoutMethod}. Processing time: 2-3 business days.` });
    setPayoutAmount('');
    setPayoutNote('');
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-[1.75rem] font-bold tracking-tight sm:text-3xl">{t('ib.dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t('ib.dashboard.subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('ib.totalCommission')}  value={`$${fmt(m?.total_commission ?? 0)}`}       icon={DollarSign} accent="amber" />
        <StatCard label={t('ib.pendingCommission')} value={`$${fmt(m?.pending_commission ?? 0)}`}     icon={Clock}      accent="amber" />
        <StatCard label={t('ib.totalClients')}      value={String(m?.total_clients ?? 0)}              icon={Users}      accent="blue" />
        <StatCard label={t('ib.activeClients')}     value={String(m?.active_clients_month ?? 0)}       icon={TrendingUp} accent="green" />
      </div>

      {/* Chart + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard title={t('ib.commissionLast7d')} className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.daily_stats ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-shadow-3)',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(v) => `$${fmt(Number(v ?? 0))}`}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title={t('ib.topClientsByVolume')} className="lg:col-span-2">
          <div className="space-y-3">
            {(data?.top_clients ?? []).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.client_code}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{c.total_volume} {t('ib.lots')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">${fmt(c.commission_generated)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Sub-IBs */}
      {(data?.sub_ibs ?? []).length > 0 && (
        <SectionCard title={t('ib.subIbs')}>
          <div className="space-y-3">
            {(data?.sub_ibs ?? []).map((ib) => (
              <div key={ib.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{ib.level_label}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{ib.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ib.ib_code} · {ib.clients} clients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{ib.total_volume} {t('ib.lots')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">${fmt(ib.total_commission)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Commission Payout Request */}
      <SectionCard
        title="Request Commission Payout"
        description={`Available pending commission: $${fmt(pendingCommission)}`}
      >
        <form onSubmit={handlePayoutSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Amount (USD) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                max={pendingCommission}
                placeholder="0.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                disabled={pendingCommission <= 0}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Payment Method *</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}
                disabled={pendingCommission <= 0}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Crypto">Crypto</option>
                <option value="Internal">Internal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Note (optional)</label>
            <textarea
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              placeholder="Any additional information..."
              disabled={pendingCommission <= 0}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={2}
            />
          </div>
          {payoutError && <p className="text-xs text-destructive">{payoutError}</p>}
          {pendingCommission <= 0 && (
            <p className="text-xs text-muted-foreground">No pending commission available for payout.</p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              disabled={pendingCommission <= 0}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <DollarSign className="h-4 w-4" />
              Request Payout
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
