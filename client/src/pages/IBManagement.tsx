import { useMemo, useState } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, Eye, EyeOff, Users, GitBranch, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatCard } from '@/components/shared/StatCard';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useClientsStore } from '@/stores/clients.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { IBClassification } from '@/lib/workbook';

const ibClassColors: Record<string, string> = {
  trusted:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  hard_debt:       'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  impossible_debt: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

function IBClassBadge({ cls, lang }: { cls: IBClassification; lang: string }) {
  const labelMap: Record<string, { en: string; ar: string }> = {
    trusted:         { en: 'Trusted',         ar: 'موثوق' },
    hard_debt:       { en: 'Hard debt',       ar: 'ديون صعبة' },
    impossible_debt: { en: 'Impossible debt', ar: 'ديون مستحيلة' },
  };
  const cfg = labelMap[cls] ?? { en: cls, ar: cls };
  const color = ibClassColors[cls] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', color)}>
      {lang === 'ar' ? cfg.ar : cfg.en}
    </span>
  );
}

function AddIBDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addIB, ibClassifications } = useClientsStore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', mt5AccountNo: '', treeAccountCode: '', classification: 'trusted' as IBClassification,
    commissionRate: '', spreadGrant: '', notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mt5AccountNo) return;
    addIB({
      name: form.name, mt5AccountNo: form.mt5AccountNo,
      treeAccountCode: form.treeAccountCode || undefined,
      classification: form.classification,
      active: true, linkedClientIds: [], subIBIds: [],
      commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
      spreadGrant: form.spreadGrant ? Number(form.spreadGrant) : undefined,
      totalCommissionEarned: 0, totalCommissionPaid: 0,
      notes: form.notes || undefined,
    });
    toast({ title: t('toast.ibAdded') });
    onClose();
    setForm({ name: '', mt5AccountNo: '', treeAccountCode: '', classification: 'trusted', commissionRate: '', spreadGrant: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ib.mgmt.add')}</DialogTitle>
          <DialogDescription>{t('ib.mgmt.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('field.name')} *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="IB name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">MT5 Account # *</label>
              <Input value={form.mt5AccountNo} onChange={(e) => setForm((f) => ({ ...f, mt5AccountNo: e.target.value }))} placeholder="22121" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('clients.treeAccount')}</label>
              <Input value={form.treeAccountCode} onChange={(e) => setForm((f) => ({ ...f, treeAccountCode: e.target.value }))} placeholder="Code" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('clients.classification')}</label>
            <select value={form.classification} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {ibClassifications.map((k) => (
                <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('ib.mgmt.commRate')} (%)</label>
              <Input type="number" step="0.1" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} placeholder="2.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('ib.mgmt.spreadGrant')}</label>
              <Input type="number" step="0.01" value={form.spreadGrant} onChange={(e) => setForm((f) => ({ ...f, spreadGrant: e.target.value }))} placeholder="0.3" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('field.note')}</label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t('action.cancel')}</Button>
            <Button type="submit" size="sm" variant="gradient">{t('action.add')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IBManagement() {
  const { t, lang } = useTranslation();
  const { ibs, clients, setIBActive } = useClientsStore();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ibs.filter((ib) => {
      if (!showInactive && !ib.active) return false;
      if (!q) return true;
      return ib.name.toLowerCase().includes(q) || ib.mt5AccountNo.includes(q);
    });
  }, [ibs, search, showInactive]);

  const activeIBs = ibs.filter((ib) => ib.active);
  const totalOutstanding = ibs.reduce((sum, ib) => sum + ((ib.totalCommissionEarned ?? 0) - (ib.totalCommissionPaid ?? 0)), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('ib.mgmt.title')}
        subtitle={t('ib.mgmt.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInactive((v) => !v)} className={cn('gap-1.5 text-xs', showInactive && 'text-primary')}>
              {showInactive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {t('ib.mgmt.showInactive')}
            </Button>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('ib.mgmt.add')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={lang === 'ar' ? 'إجمالي الوكلاء' : 'Total IBs'} value={ibs.length} icon={GitBranch} accent="blue" />
        <StatCard label={lang === 'ar' ? 'وكلاء نشطون' : 'Active IBs'} value={activeIBs.length} icon={Users} accent="green" />
        <StatCard label={lang === 'ar' ? 'عمولة معلقة' : 'Outstanding commission'} value={`$${totalOutstanding.toLocaleString()}`} icon={DollarSign} accent="amber" />
      </div>

      <SectionCard padded={false}>
        <div className="flex items-center gap-3 p-5">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('action.search')} name, account…`} className="ps-9" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t('field.name')}</TableHead>
                <TableHead className="w-28">MT5 Account</TableHead>
                <TableHead>{t('clients.classification')}</TableHead>
                <TableHead className="w-20 text-right">{t('ib.mgmt.commRate')}</TableHead>
                <TableHead className="w-28 text-right">{t('ib.mgmt.commBalance')}</TableHead>
                <TableHead className="w-20 text-center">{t('data.col.active')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ib) => {
                const commBalance = (ib.totalCommissionEarned ?? 0) - (ib.totalCommissionPaid ?? 0);
                const linkedClients = clients.filter((c) => c.ibParentId === ib.id);
                const isExpanded = expanded === ib.id;
                return (
                  <>
                    <TableRow key={ib.id} className={cn(!ib.active && 'opacity-40', 'cursor-pointer hover:bg-accent/30')}
                      onClick={() => setExpanded(isExpanded ? null : ib.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{ib.name}</p>
                          {ib.notes && <p className="text-xs text-muted-foreground truncate max-w-xs">{ib.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{ib.mt5AccountNo}</TableCell>
                      <TableCell><IBClassBadge cls={ib.classification} lang={lang} /></TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {ib.commissionRate != null ? `${ib.commissionRate}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-bold tabular-nums text-sm', commBalance > 0 ? 'text-amber-600' : 'text-success')}>
                          ${commBalance.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button onClick={(e) => { e.stopPropagation(); setIBActive(ib.id, !ib.active); }}
                          className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                            ib.active ? 'bg-emerald-500' : 'bg-muted')}
                          role="switch" aria-checked={ib.active}>
                          <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', ib.active ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${ib.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="grid gap-4 sm:grid-cols-3 text-sm">
                            <div>
                              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('ib.mgmt.traders')} ({linkedClients.length})</p>
                              {linkedClients.length === 0
                                ? <p className="text-muted-foreground text-xs">No linked traders</p>
                                : linkedClients.map((c) => (
                                  <div key={c.id} className="flex items-center gap-2 py-0.5">
                                    <span className="font-mono text-xs text-muted-foreground">{c.accountNo}</span>
                                    <span className="text-xs">{c.name}</span>
                                  </div>
                                ))
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Commission Detail</p>
                              <div className="space-y-1">
                                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{t('ib.mgmt.commEarned')}</span><span className="font-mono text-xs">${(ib.totalCommissionEarned ?? 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{t('ib.mgmt.commPaid')}</span><span className="font-mono text-xs">${(ib.totalCommissionPaid ?? 0).toLocaleString()}</span></div>
                                <div className="flex justify-between border-t border-border pt-1"><span className="text-xs font-semibold">{t('ib.mgmt.commBalance')}</span><span className={cn('font-mono text-xs font-bold', commBalance > 0 ? 'text-amber-600' : 'text-success')}>${commBalance.toLocaleString()}</span></div>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Terms</p>
                              <div className="space-y-1">
                                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{t('ib.mgmt.commRate')}</span><span className="text-xs">{ib.commissionRate != null ? `${ib.commissionRate}%` : '—'}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{t('ib.mgmt.spreadGrant')}</span><span className="text-xs">{ib.spreadGrant != null ? `${ib.spreadGrant}` : '—'}</span></div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{t('report.noMatch')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <AddIBDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
