import { Fragment, useMemo, useState } from 'react';
import {
  Plus, Search, AlertTriangle, Clock, DollarSign, FileText,
  ChevronDown, ChevronUp, Filter,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOperationsStore } from '@/stores/operations.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import type { RequestStatus, RequestType } from '@/lib/workbook';
import { RequestTypeBadge } from '@/components/operations/RequestTypeBadge';
import { RequestStatusBadge } from '@/components/operations/RequestStatusBadge';
import { RequestTimeline } from '@/components/operations/RequestTimeline';
import { RequestDetailSheet } from '@/components/operations/RequestDetailSheet';
import { NewRequestDialog } from '@/components/operations/NewRequestDialog';
import type { OperationRequest } from '@/lib/workbook';
import { useToast } from '@/hooks/use-toast';

const STATUS_FILTERS: (RequestStatus | 'ALL')[] = ['ALL', 'pending', 'confirmed', 'executed', 'voucher'];
const TYPE_FILTERS: (RequestType | 'ALL')[] = [
  'ALL', 'deposit', 'withdrawal', 'ib_deposit', 'ib_withdrawal', 'transfer_to', 'transfer_from', 'expense',
];

function timeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Operations() {
  const { t } = useTranslation();
  const { requests, confirmRequest, executeRequest, createVoucher, getPendingCount, getUrgentCount, getTodayVolume } = useOperationsStore();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<OperationRequest | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (q) {
        const reqLabel = `REQ-${String(r.requestNo).padStart(3, '0')}`;
        const accountNos = r.lines.map((l) => l.accountNo).join(' ');
        if (!reqLabel.toLowerCase().includes(q) && !accountNos.toLowerCase().includes(q) && !(r.note ?? '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, typeFilter, dateFrom, dateTo, search]);

  const pendingCount = getPendingCount();
  const urgentCount = getUrgentCount();
  const todayVol = getTodayVolume();
  const awaitVoucher = requests.filter((r) => r.status === 'executed').length;

  const pendingFiltered = filtered.filter((r) => r.status === 'pending');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFiltered.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkConfirm = () => {
    const confirmerEmail = user?.email ?? 'admin@demo.com';
    selected.forEach((id) => {
      const req = requests.find((r) => r.id === id);
      if (req?.status === 'pending') confirmRequest(id, confirmerEmail);
    });
    toast({ title: `${selected.size} request(s) confirmed` });
    setSelected(new Set());
  };

  const handleQuickAction = (req: OperationRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (req.status === 'pending') {
      confirmRequest(req.id, 'admin@demo.com');
      toast({ title: t('toast.requestConfirmed') });
    } else if (req.status === 'confirmed') {
      executeRequest(req.id, 'admin@demo.com');
      toast({ title: t('toast.requestExecuted') });
    } else if (req.status === 'executed') {
      createVoucher(req.id);
      toast({ title: t('toast.voucherGenerated') });
    }
  };

  const quickActionLabel = (status: RequestStatus): string | null => {
    if (status === 'pending') return t('req.status.confirmed');
    if (status === 'confirmed') return t('req.status.executed');
    if (status === 'executed') return t('req.status.voucher');
    return null;
  };

  const quickActionVariant = (status: RequestStatus): string => {
    if (status === 'pending') return 'bg-blue-500 hover:bg-blue-600 text-white';
    if (status === 'confirmed') return 'bg-violet-500 hover:bg-violet-600 text-white';
    if (status === 'executed') return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    return '';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('ops.requests')}
        subtitle="The approval inbox for client money movements — deposits, withdrawals, and transfers"
        hint={
          <PageHint id="operations" title="What is this page?">
            Operations is the approval inbox for client money movements (deposits, withdrawals, internal transfers). Each request must be reviewed and confirmed before it gets recorded in the books.
          </PageHint>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              className={cn('gap-1.5 text-xs', showFilters && 'text-primary bg-primary/10')}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" /> {t('action.filter')}
            </Button>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('ops.requests.new')}
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label={t('ops.requests.pending')}
          value={pendingCount}
          icon={Clock}
          accent="amber"
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          label={t('ops.requests.urgent')}
          value={urgentCount}
          icon={AlertTriangle}
          accent="pink"
          onClick={() => setStatusFilter(urgentCount > 0 ? 'pending' : 'ALL')}
        />
        <StatCard
          label={t('ops.requests.todayVol')}
          value={`$${todayVol.toLocaleString()}`}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label={t('ops.requests.awaitVoucher')}
          value={awaitVoucher}
          icon={FileText}
          accent="blue"
          onClick={() => setStatusFilter('executed')}
        />
      </div>

      <SectionCard padded={false}>
        {/* Search + status tabs */}
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="REQ-001, account #, note…"
                className="ps-9"
              />
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => {
              const count = s === 'ALL' ? requests.length : requests.filter((r) => r.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent/60',
                  )}
                >
                  {s === 'ALL' ? t('action.all') : t(`req.status.${s}` as any)}
                  <span className={cn(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    statusFilter === s ? 'bg-white/20' : 'bg-background',
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as RequestType | 'ALL')}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                >
                  <option value="ALL">{t('action.all')}</option>
                  {TYPE_FILTERS.filter((f) => f !== 'ALL').map((f) => (
                    <option key={f} value={f}>{t(`req.type.${f}` as any)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
              </div>
              {(typeFilter !== 'ALL' || dateFrom || dateTo) && (
                <Button
                  variant="ghost" size="sm" className="h-8 text-xs self-end"
                  onClick={() => { setTypeFilter('ALL'); setDateFrom(''); setDateTo(''); }}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-blue-500/10 px-5 py-2.5">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{selected.size} selected</span>
            <Button size="sm" variant="default" className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white" onClick={handleBulkConfirm}>
              Confirm All
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  {pendingFiltered.length > 0 && (
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-input cursor-pointer"
                      title="Select all pending"
                    />
                  )}
                </TableHead>
                <TableHead className="w-8" />
                <TableHead className="w-24">{t('req.field.requestNo')}</TableHead>
                <TableHead>{t('field.opType')}</TableHead>
                <TableHead className="w-28">{t('field.date')}</TableHead>
                <TableHead>{t('req.field.accountNo')} / Note</TableHead>
                <TableHead className="w-28 text-right">Amount</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-28 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                const total = req.lines.reduce((s, l) => s + l.amount, 0);
                const pendingTime = req.status === 'pending'
                  ? timeSince(req.timeline[0]?.at ?? req.date)
                  : null;
                const actionLabel = quickActionLabel(req.status);
                const isSelected = selected.has(req.id);

                return (
                  <Fragment key={req.id}>
                    <TableRow
                      className={cn('cursor-pointer hover:bg-accent/30', req.priority === 'urgent' && 'border-s-2 border-s-red-500', isSelected && 'bg-blue-500/5')}
                      onClick={() => setDetailRequest(req)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {req.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(req.id)}
                            className="h-3.5 w-3.5 rounded border-input cursor-pointer"
                          />
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : req.id); }}>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-bold">
                            REQ-{String(req.requestNo).padStart(3, '0')}
                          </span>
                          {req.priority === 'urgent' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
                              <AlertTriangle className="h-2.5 w-2.5" /> {t('req.field.urgent')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RequestTypeBadge type={req.type} size="xs" />
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">{req.date}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap gap-1">
                            {req.lines.slice(0, 2).map((l) => (
                              <span key={l.id} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                                {l.accountNo}
                              </span>
                            ))}
                            {req.lines.length > 2 && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{req.lines.length - 2}
                              </span>
                            )}
                          </div>
                          {req.note && <p className="truncate text-[11px] text-muted-foreground max-w-[200px]">{req.note}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                        ${total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <RequestStatusBadge status={req.status} size="xs" />
                          {pendingTime && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" /> {pendingTime}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {actionLabel && (
                          <button
                            onClick={(e) => handleQuickAction(req, e)}
                            className={cn('rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-90', quickActionVariant(req.status))}
                          >
                            {actionLabel}
                          </button>
                        )}
                        {req.status === 'voucher' && req.voucherRef && (
                          <span className="font-mono text-[10px] text-emerald-600">{req.voucherRef}</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded timeline row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20 p-4">
                          <RequestTimeline events={req.timeline} compact />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    {t('report.noMatch')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* Detail sheet */}
      {detailRequest && (
        <RequestDetailSheet
          request={requests.find((r) => r.id === detailRequest.id) ?? detailRequest}
          onClose={() => setDetailRequest(null)}
        />
      )}

      {/* New request dialog */}
      <NewRequestDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
