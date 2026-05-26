import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useOpModuleStore, OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN,
  type OpRequest, type OpType,
} from '@/stores/opModule.store';
import { StatusBadge } from './RequestsPage';
import { VerifyModal } from '@/components/operations/VerifyModal';
import { RejectModal } from '@/components/operations/RejectModal';
import { HistoryModal } from '@/components/operations/HistoryModal';

export default function VerificationPage() {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const { requests, getVerificationCount } = useOpModuleStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpType | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<OpRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<OpRequest | null>(null);

  // Verification page shows: requests in 'verification' status
  // Also shows withdrawals in 'execution' that are awaiting fund sending (after MT5 exec)
  const relevant = useMemo(() =>
    requests.filter((r) =>
      r.status === 'verification' ||
      (r.status === 'execution' && (r.request_type === 'withdrawal' || r.request_type === 'agent_withdrawal'))
    ), [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return relevant.filter((r) => {
      if (typeFilter !== 'ALL' && r.request_type !== typeFilter) return false;
      if (q) {
        const hit = r.request_number.toLowerCase().includes(q)
          || r.lines.some((l) => l.mt5_account_number.toLowerCase().includes(q))
          || r.notes_1.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [relevant, search, typeFilter]);

  const count = getVerificationCount();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('opmod.verification.title')}
        subtitle={t('opmod.verification.subtitle')}
        hint={
          <PageHint id="op-verification" title={t('opmod.verification.title')}>
            {t('opmod.verification.subtitle')}
          </PageHint>
        }
        actions={
          <div className="flex items-center gap-2">
            {count > 0 && (
              <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">{count}</span>
            )}
            <Button variant="ghost" size="sm" className={cn('gap-1.5 text-xs', showFilters && 'text-primary bg-primary/10')} onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-3.5 w-3.5" /> {t('opmod.action.filter')}
            </Button>
          </div>
        }
      />

      <SectionCard padded={false}>
        {/* Search + filters */}
        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Request number, MT5 account…" className="ps-9" />
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">{t('opmod.col.type')}</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as OpType | 'ALL')} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
                  <option value="ALL">{t('action.all')}</option>
                  {(['deposit','withdrawal','agent_deposit','agent_withdrawal','transfer_from','transfer_to','expense'] as OpType[]).map((ty) => (
                    <option key={ty} value={ty}>{lang === 'ar' ? OP_TYPE_LABEL_AR[ty] : OP_TYPE_LABEL_EN[ty]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t('opmod.col.reqNo')}</TableHead>
                <TableHead className="w-24">{t('opmod.col.date')}</TableHead>
                <TableHead>{t('opmod.col.type')}</TableHead>
                <TableHead>{t('opmod.col.mt5')}</TableHead>
                <TableHead className="text-right">{t('opmod.col.amountUsd')}</TableHead>
                <TableHead>{t('opmod.col.sourceAccount')}</TableHead>
                <TableHead>{t('opmod.col.notes1')}</TableHead>
                <TableHead>{t('opmod.col.status')}</TableHead>
                <TableHead className="text-right">{t('opmod.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id} className="hover:bg-accent/20">
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-primary">{req.request_number}</span>
                    {req.source === 'app' && <span className="ms-1.5 rounded bg-violet-100 px-1 text-[9px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">APP</span>}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{req.request_date}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                      {lang === 'ar' ? OP_TYPE_LABEL_AR[req.request_type] : OP_TYPE_LABEL_EN[req.request_type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {req.lines.slice(0, 2).map((l) => <span key={l.id} className="font-mono text-xs text-muted-foreground">{l.mt5_account_number}</span>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ${req.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{req.lines[0]?.account_name ?? '—'}</TableCell>
                  <TableCell className="max-w-[160px]">
                    <p className="truncate text-xs text-muted-foreground">{req.notes_1}</p>
                  </TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setVerifyTarget(req)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" /> {t('opmod.action.confirmReceipt')}
                      </button>
                      <button
                        onClick={() => setRejectTarget(req.id)}
                        className="rounded-lg border border-destructive/40 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {t('opmod.action.reject')}
                      </button>
                      <button onClick={() => setHistoryTarget(req)} className="rounded-md p-1 hover:bg-accent text-xs text-muted-foreground">
                        ···
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">{t('opmod.empty.verification')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <VerifyModal request={verifyTarget} onClose={() => setVerifyTarget(null)} />
      <RejectModal requestId={rejectTarget} onClose={() => setRejectTarget(null)} />
      {historyTarget && <HistoryModal request={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}
