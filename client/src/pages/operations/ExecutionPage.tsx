import { useState, useMemo } from 'react';
import { Search, Zap } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  useOpModuleStore, OP_TYPE_LABEL_AR, OP_TYPE_LABEL_EN,
  type OpRequest,
} from '@/stores/opModule.store';
import { StatusBadge } from './RequestsPage';
import { HistoryModal } from '@/components/operations/HistoryModal';

export default function ExecutionPage() {
  const { t, lang } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const { requests, advanceStage, getExecutionCount } = useOpModuleStore();

  const [search, setSearch] = useState('');
  const [historyTarget, setHistoryTarget] = useState<OpRequest | null>(null);

  // Only show requests in 'execution' status that are NOT withdrawals awaiting verification
  // (withdrawals go pending → execution → verification → completed)
  // Execution page shows all 'execution' requests — deposits awaiting MT5 exec, withdrawals awaiting MT5 exec
  const relevant = useMemo(() =>
    requests.filter((r) => r.status === 'execution'), [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return relevant;
    return relevant.filter((r) =>
      r.request_number.toLowerCase().includes(q)
      || r.lines.some((l) => l.mt5_account_number.toLowerCase().includes(q))
      || r.notes_1.toLowerCase().includes(q)
    );
  }, [relevant, search]);

  const count = getExecutionCount();

  const handleMarkExecuted = (req: OpRequest) => {
    advanceStage(req.id, user?.full_name ?? 'admin', 'MT5 execution completed');
    const isWithdrawal = req.request_type === 'withdrawal' || req.request_type === 'agent_withdrawal';
    toast({
      title: isWithdrawal ? t('opmod.toast.advanced') : t('opmod.toast.completed'),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('opmod.execution.title')}
        subtitle={t('opmod.execution.subtitle')}
        hint={
          <PageHint id="op-execution" title={t('opmod.execution.title')}>
            {t('opmod.execution.subtitle')}
          </PageHint>
        }
        actions={
          count > 0 ? (
            <span className="rounded-full bg-purple-500 px-2.5 py-0.5 text-xs font-bold text-white">{count}</span>
          ) : null
        }
      />

      <SectionCard padded={false}>
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Request number, MT5 account…" className="ps-9" />
          </div>
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
                <TableHead>{t('opmod.col.counterAccount')}</TableHead>
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
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{req.request_date}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
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
                  <TableCell className="text-xs text-muted-foreground">{req.lines[0]?.counter_account_name ?? '—'}</TableCell>
                  <TableCell className="max-w-[160px]">
                    <p className="truncate text-xs text-muted-foreground">{req.notes_1}</p>
                  </TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleMarkExecuted(req)}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-600 transition-colors"
                      >
                        <Zap className="h-3 w-3" /> {t('opmod.action.markExecuted')}
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
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">{t('opmod.empty.execution')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {historyTarget && <HistoryModal request={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}
