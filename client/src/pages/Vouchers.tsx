import { useMemo, useState } from 'react';
import { Search, Receipt, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { voucherSeries } from '@/lib/workbook';
import { cn } from '@/lib/utils';

export default function Vouchers() {
  const [search, setSearch] = useState('');
  const [activeCode, setActiveCode] = useState(voucherSeries[0]?.accountCode ?? '');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return voucherSeries;
    return voucherSeries.filter(
      (s) => s.accountCode.toLowerCase().includes(q) || s.accountName.toLowerCase().includes(q),
    );
  }, [search]);

  const active = voucherSeries.find((s) => s.accountCode === activeCode) ?? voucherSeries[0];
  const lastVoucher = active?.vouchers[active.vouchers.length - 1];

  const totalVouchers = voucherSeries.reduce((acc, s) => acc + s.vouchers.length, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vouchers"
        subtitle={
          <span className="flex items-center gap-2">
            <span>Sequential receipt/voucher tracking per account</span>
            <span dir="rtl" className="text-muted-foreground/80">أرقام السندات</span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Total vouchers" bodyClassName="p-5">
          <span className="text-2xl font-bold tabular-nums">{totalVouchers}</span>
        </SectionCard>
        <SectionCard title="Accounts with series" bodyClassName="p-5">
          <span className="text-2xl font-bold tabular-nums">{voucherSeries.length}</span>
        </SectionCard>
        <SectionCard title="Latest voucher" bodyClassName="p-5">
          <span className="text-2xl font-bold tabular-nums">
            {voucherSeries.flatMap((s) => s.vouchers).reduce((mx, v) => Math.max(mx, v), 0)}
          </span>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left list */}
        <SectionCard
          className="lg:col-span-4"
          title="Accounts"
          action={
            <div className="relative w-44">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          }
          bodyClassName="p-2"
        >
          <div className="max-h-[480px] space-y-0.5 overflow-y-auto">
            {filtered.map((s) => {
              const isActive = s.accountCode === activeCode;
              return (
                <button
                  key={s.accountCode}
                  onClick={() => setActiveCode(s.accountCode)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors',
                    isActive ? 'bg-accent' : 'hover:bg-accent/50',
                  )}
                >
                  <Receipt className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.accountName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.accountCode}</p>
                  </div>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{s.vouchers.length}</Badge>
                  <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isActive && 'translate-x-0.5')} />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No accounts match.</p>
            )}
          </div>
        </SectionCard>

        {/* Right detail */}
        <SectionCard
          className="lg:col-span-8"
          title={active ? `${active.accountName} · ${active.accountCode}` : 'Select an account'}
          description={active ? `${active.vouchers.length} vouchers · latest ${lastVoucher ?? '—'}` : undefined}
        >
          {active ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {active.vouchers.map((v, i) => (
                <div
                  key={`${v}-${i}`}
                  className={cn(
                    'group rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-card',
                    v === lastVoucher && 'border-primary/60 bg-primary/5',
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    #{i + 1}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{v}</p>
                </div>
              ))}
              {active.vouchers.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No vouchers issued yet for this account.
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
