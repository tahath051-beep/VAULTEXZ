import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { getIBDashboard } from '@/api/ib.api';
import { fmt } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function IBDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['ib-dashboard'], queryFn: getIBDashboard });

  if (isLoading) return <PageLoader />;

  const m = data?.metrics;

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
    </div>
  );
}
