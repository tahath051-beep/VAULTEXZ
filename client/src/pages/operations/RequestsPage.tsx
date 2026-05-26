import { useState, useMemo, Fragment } from 'react';
import { Plus, Search, Filter, MoreVertical, ChevronDown, ChevronUp, Clock, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useOpModuleStore, OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN, OP_STATUS_COLORS,
  type OpRequest, type OpType, type OpStatus,
} from '@/stores/opModule.store';
import { NewOpRequestModal } from '@/components/operations/NewOpRequestModal';
import { RejectModal } from '@/components/operations/RejectModal';
import { HistoryModal } from '@/components/operations/HistoryModal';

const ALL_TYPES: OpType[] = ['deposit', 'withdrawal', 'agent_deposit', 'agent_withdrawal', 'transfer_from', 'transfer_to', 'expense'];
const VISIBLE_STATUSES: OpStatus[] = ['pending', 'verification', 'execution', 'completed', 'rejected'];

export default function RequestsPage() {
  const { t, lang } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const { requests, advanceStage, trashRequest, getPendingCount, settings } = useOpModuleStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<OpStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<OpRequest | null>(null);

  const canSeeTrashed = (user?.role === 'admin' || user?.role === 'financial_manager');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (!canSeeTrashed && r.status === 'trashed') return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && r.request_type !== typeFilter) return false;
      if (dateFrom && r.request_date < dateFrom) return false;
      if (dateTo && r.request_date > dateTo) return false;
      if (q) {
        const hit = r.request_number.toLowerCase().includes(q)
          || r.lines.some((l) => l.mt5_account_number.toLowerCase().includes(q))
          || r.notes_1.toLowerCase().includes(q)
          || (r.notes_2 ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [requests, search, typeFilter, statusFilter, dateFrom, dateTo, canSeeTrashed]);

  const pendingCount = getPendingCount();
  const pendingToday = requests.filter((r) => r.status === 'pending' && r.request_date === new Date().toISOString().slice(0, 10)).length;
  const totalPendingUsd = requests.filter((r) => r.status === 'pending').reduce((s, r) => s + r.total_amount_usd, 0);

  const handleConfirm = (req: OpRequest) => {
    advanceStage(req.id, user?.full_name ?? 'admin');
    toast({ title: t('opmod.toast.advanced') });
  };

  const handleTrash = (id: string) => {
    trashRequest(id);
    toast({ title: t('opmod.toast.trashed') });
  };

  const nextStageLabel = (req: OpRequest) => {
    if (req.status !== 'pending') return null;
    const isWithdrawal = req.request_type === 'withdrawal' || req.request_type === 'agent_withdrawal';
    return isWithdrawal ? t('opmod.status.execution') : t('opmod.status.verification');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('opmod.requests.title')}
        subtitle={t('opmod.requests.subtitle')}
        hint={
          <PageHint id="op-requests" title={t('opmod.requests.title')}>
            {t('opmod.requests.subtitle')}
          </PageHint>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className={cn('gap-1.5 text-xs', showFilters && 'text-primary bg-primary/10')} onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-3.5 w-3.5" /> {t('opmod.action.filter')}
            </Button>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('opmod.action.newRequest')}
            </Button>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('opmod.status.pending')} value={pendingCount} icon={Clock} accent="amber" />
        <StatCard label="Pending Today" value={pendingToday} icon={Clock} accent="blue" />
        <StatCard label="Pending Volume (USD)" value={`$${totalPendingUsd.toLocaleString()}`} icon={DollarSign} accent="green" />
      </div>

      <SectionCard padded={false}>
        {/* Search + filters */}
        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="REQ-2024-0001, MT5 account, notes…" className="ps-9" />
          </div>

          {/* Status pill filters */}
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', ...VISIBLE_STATUSES] as const).map((s) => {
              const count = s === 'ALL' ? filtered.length : requests.filter((r) => r.status === s).length;
              return (
                <button key={s} onClick={() => setStatusFilter(s as OpStatus | 'ALL')}
                  className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/60')}>
                  {s === 'ALL' ? t('action.all') : t(`opmod.status.${s}` as any)}
                  <span className={cn('rounded-full px-1.5 text-[10px] font-bold', statusFilter === s ? 'bg-white/20' : 'bg-background')}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">{t('opmod.col.type')}</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as OpType | 'ALL')} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
                  <option value="ALL">{t('action.all')}</option>
                  {ALL_TYPES.map((t2) => <option key={t2} value={t2}>{lang === 'ar' ? OP_TYPE_LABEL_AR[t2] : OP_TYPE_LABEL_EN[t2]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-32">{t('opmod.col.reqNo')}</TableHead>
                <TableHead className="w-24">{t('opmod.col.date')}</TableHead>
                <TableHead>{t('opmod.col.type')}</TableHead>
                <TableHead>{t('opmod.col.mt5')}</TableHead>
                <TableHead className="text-right">{t('opmod.col.amountUsd')}</TableHead>
                <TableHead>{t('opmod.col.notes1')}</TableHead>
                <TableHead>{t('opmod.col.status')}</TableHead>
                <TableHead className="text-right">{t('opmod.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                const label = nextStageLabel(req);

                return (
                  <Fragment key={req.id}>
                    <TableRow className={cn('cursor-pointer hover:bg-accent/20', req.status === 'trashed' && 'opacity-50')}>
                      <TableCell onClick={() => setExpandedId(isExpanded ? null : req.id)} className="cursor-pointer">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{req.request_number}</span>
                        {req.source === 'app' && <span className="ms-1.5 rounded bg-violet-100 px-1 text-[9px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">APP</span>}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">{req.request_date}</TableCell>
                      <TableCell>
                        <TypeBadge type={req.request_type} lang={lang} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {req.lines.slice(0, 2).map((l) => (
                            <span key={l.id} className="font-mono text-xs text-muted-foreground">{l.mt5_account_number}</span>
                          ))}
                          {req.lines.length > 2 && <span className="text-[10px] text-muted-foreground">+{req.lines.length - 2} more</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        ${req.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <p className="truncate text-xs text-muted-foreground">{req.notes_1}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {label && req.status === 'pending' && (
                            <button onClick={() => handleConfirm(req)} className="rounded-lg bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-600 transition-colors">
                              {t('opmod.action.confirm')}
                            </button>
                          )}
                          <MoreMenu
                            req={req}
                            canSeeTrashed={canSeeTrashed}
                            onReject={() => setRejectTarget(req.id)}
                            onTrash={() => handleTrash(req.id)}
                            onHistory={() => setHistoryTarget(req)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20 p-0">
                          <ExpandedLines req={req} lang={lang} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">{t('opmod.empty.requests')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <NewOpRequestModal open={newOpen} onClose={() => setNewOpen(false)} />
      <RejectModal requestId={rejectTarget} onClose={() => setRejectTarget(null)} />
      {historyTarget && <HistoryModal request={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type, lang }: { type: OpType; lang: string }) {
  const COLORS: Record<OpType, string> = {
    deposit:          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    withdrawal:       'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    agent_deposit:    'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    agent_withdrawal: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    transfer_from:    'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    transfer_to:      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    expense:          'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  };
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', COLORS[type])}>
      {lang === 'ar' ? OP_TYPE_LABEL_AR[type] : OP_TYPE_LABEL_EN[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: OpStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', OP_STATUS_COLORS[status])}>
      {t(`opmod.status.${status}` as any)}
    </span>
  );
}

function MoreMenu({ req, canSeeTrashed, onReject, onTrash, onHistory }: {
  req: OpRequest; canSeeTrashed: boolean;
  onReject: () => void; onTrash: () => void; onHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1 hover:bg-accent">
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute end-0 z-20 mt-1 w-44 rounded-xl border border-border bg-popover shadow-lg">
          <div className="p-1 space-y-0.5">
            <button onClick={() => { onHistory(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-accent">
              {t('opmod.action.viewHistory')}
            </button>
            {req.status === 'pending' && (
              <>
                <button onClick={() => { onReject(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                  {t('opmod.action.reject')}
                </button>
                <button onClick={() => { onTrash(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
                  {t('opmod.action.trash')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedLines({ req, lang }: { req: OpRequest; lang: string }) {
  return (
    <div className="p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Lines ({req.lines.length})</p>
      <div className="space-y-1">
        {req.lines.map((l) => (
          <div key={l.id} className="grid grid-cols-6 gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
            <span className="font-mono font-semibold text-primary">{l.mt5_account_number}</span>
            <span className="text-muted-foreground">{lang === 'ar' ? l.account_name : l.account_name}</span>
            <span className="text-muted-foreground">{l.counter_account_name}</span>
            <span>{l.currency}</span>
            <span className="tabular-nums">{l.amount_in_currency.toLocaleString()}</span>
            <span className="text-right font-mono font-semibold">${l.amount_usd.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {req.rejection_reason && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-xs font-semibold text-destructive">Rejection reason: {req.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}
