import { useMemo, useState } from 'react';
import { Search, Plus, AlertTriangle, Users, UserX, Eye, EyeOff, FileText, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { useSortable } from '@/hooks/useSortable';
import { EmptyClients, EmptySearch } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
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
import type { ClientClassification } from '@/lib/workbook';

const classConfig: Record<ClientClassification, { labelKey: string; color: string }> = {
  good:    { labelKey: 'clients.class.good',    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  neutral: { labelKey: 'clients.class.neutral', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  bad:     { labelKey: 'clients.class.bad',     color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  fraud:   { labelKey: 'clients.class.fraud',   color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
};

function ClassBadge({ cls }: { cls: ClientClassification }) {
  const { t } = useTranslation();
  const cfg = classConfig[cls];
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.color)}>
      {t(cfg.labelKey as Parameters<typeof t>[0])}
    </span>
  );
}

function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ibs, addClient } = useClientsStore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    accountNo: '', name: '', arabic: '', ibParentId: '',
    classification: 'neutral' as ClientClassification,
    treeAccountCode: '', notes: '', creditLimit: '',
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountNo || !form.name) return;
    addClient({
      accountNo: form.accountNo, name: form.name, arabic: form.arabic || undefined,
      ibParentId: form.ibParentId || undefined,
      classification: form.classification,
      treeAccountCode: form.treeAccountCode || undefined,
      notes: form.notes || undefined,
      active: true, joinDate: form.joinDate,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
    });
    toast({ title: t('toast.clientAdded') });
    onClose();
    setForm({ accountNo: '', name: '', arabic: '', ibParentId: '', classification: 'neutral', treeAccountCode: '', notes: '', creditLimit: '', joinDate: new Date().toISOString().slice(0, 10) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('clients.add')}</DialogTitle>
          <DialogDescription>{t('clients.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('req.field.accountNo')} *</label>
              <Input value={form.accountNo} onChange={(e) => setForm((f) => ({ ...f, accountNo: e.target.value }))} placeholder="12166" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('field.name')} *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Client name" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('field.nameAr')}</label>
            <Input dir="rtl" value={form.arabic} onChange={(e) => setForm((f) => ({ ...f, arabic: e.target.value }))} placeholder="اسم العميل" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('clients.classification')}</label>
              <select value={form.classification} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value as ClientClassification }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(Object.keys(classConfig) as ClientClassification[]).map((k) => (
                  <option key={k} value={k}>{t(classConfig[k].labelKey as Parameters<typeof t>[0])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('clients.ibParent')}</label>
              <select value={form.ibParentId} onChange={(e) => setForm((f) => ({ ...f, ibParentId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">{t('clients.noIB')}</option>
                {ibs.filter((ib) => ib.active).map((ib) => (
                  <option key={ib.id} value={ib.id}>{ib.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('clients.treeAccount')}</label>
              <Input value={form.treeAccountCode} onChange={(e) => setForm((f) => ({ ...f, treeAccountCode: e.target.value }))} placeholder="Account code" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('clients.creditLimit')}</label>
              <Input type="number" value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} placeholder="0" />
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

export default function Clients() {
  const { t } = useTranslation();
  const { clients, ibs, setClientActive, updateClient } = useClientsStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<ClientClassification | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; creditLimit: string; classification: ClientClassification }>({
    name: '',
    creditLimit: '',
    classification: 'neutral',
  });

  const startEdit = (c: typeof clients[number]) => {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      creditLimit: c.creditLimit != null ? String(c.creditLimit) : '',
      classification: c.classification,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    updateClient(id, {
      name: editForm.name,
      creditLimit: editForm.creditLimit !== '' ? Number(editForm.creditLimit) : undefined,
      classification: editForm.classification,
    });
    toast({ title: t('toast.clientAdded') });
    setEditingId(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (!showInactive && !c.active) return false;
      if (classFilter !== 'ALL' && c.classification !== classFilter) return false;
      if (!q) return true;
      return c.accountNo.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.arabic?.includes(q);
    });
  }, [clients, search, classFilter, showInactive]);

  const { sorted: sortedClients, sortKey, sortDir, toggle } = useSortable(
    filtered as unknown as Record<string, unknown>[],
    'name',
  );

  function SortHead({ label, field, className }: { label: string; field: string; className?: string }) {
    const active = sortKey === field;
    return (
      <TableHead
        className={cn('cursor-pointer select-none hover:bg-muted/30 transition-colors', className)}
        onClick={() => toggle(field as never)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active
            ? sortDir === 'asc'
              ? <ChevronUp className="h-3 w-3 text-primary" />
              : <ChevronDown className="h-3 w-3 text-primary" />
            : <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />}
        </span>
      </TableHead>
    );
  }

  const activeClients = clients.filter((c) => c.active);
  const flagged = activeClients.filter((c) => c.classification === 'fraud' || c.classification === 'bad');
  const withoutIB = activeClients.filter((c) => !c.ibParentId);
  const ibName = (id?: string) => ibs.find((ib) => ib.id === id)?.name ?? '—';

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('clients.title')}
        subtitle={t('clients.subtitle2')}
        hint={
          <PageHint id="clients" title={t('hint.clients.title')}>
            {t('hint.clients.body')}
          </PageHint>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInactive((v) => !v)} className={cn('gap-1.5 text-xs', showInactive && 'text-primary')}>
              {showInactive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {t('clients.showInactive')}
            </Button>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('clients.add')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('ops.clients')} value={activeClients.length} icon={Users} accent="blue" />
        <StatCard label={t('clients.flagged')} value={flagged.length} icon={AlertTriangle} accent="pink" />
        <StatCard label={t('clients.withoutIB')} value={withoutIB.length} icon={UserX} accent="amber" />
      </div>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('action.search')} name, account…`} className="ps-9" />
          </div>
          <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1">
            {(['ALL', 'good', 'neutral', 'bad', 'fraud'] as const).map((k) => (
              <button key={k} onClick={() => setClassFilter(k)}
                className={cn('rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  classFilter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60')}>
                {k === 'ALL' ? t('action.all') : t(classConfig[k].labelKey as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label={t('req.field.accountNo')} field="accountNo" className="w-28" />
                <SortHead label={t('field.name')}          field="name" />
                <TableHead>{t('clients.ibParent')}</TableHead>
                <SortHead label={t('clients.classification')} field="classification" />
                <SortHead label={t('clients.creditLimit')} field="creditLimit" className="w-24 text-right" />
                <TableHead className="w-24 text-center">{t('data.col.active')}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sortedClients as unknown as typeof filtered).map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <TableRow key={c.id} className={cn(!c.active && 'opacity-40', isEditing && 'bg-muted/30')}>
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{c.accountNo}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.arabic && <p className="text-xs text-muted-foreground" dir="rtl">{c.arabic}</p>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.ibParentId
                        ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{ibName(c.ibParentId)}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <select
                          value={editForm.classification}
                          onChange={(e) => setEditForm((f) => ({ ...f, classification: e.target.value as ClientClassification }))}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(Object.keys(classConfig) as ClientClassification[]).map((k) => (
                            <option key={k} value={k}>{t(classConfig[k].labelKey as Parameters<typeof t>[0])}</option>
                          ))}
                        </select>
                      ) : (
                        <ClassBadge cls={c.classification} />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.creditLimit}
                          onChange={(e) => setEditForm((f) => ({ ...f, creditLimit: e.target.value }))}
                          className="h-7 text-sm w-24 text-right ml-auto"
                          placeholder="0"
                        />
                      ) : (
                        c.creditLimit != null ? `$${c.creditLimit.toLocaleString()}` : '—'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => setClientActive(c.id, !c.active)}
                        className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                          c.active ? 'bg-success dark:bg-green-500' : 'bg-muted')}
                        role="switch" aria-checked={c.active}>
                        <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', c.active ? 'translate-x-4' : 'translate-x-0')} />
                      </button>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-success" onClick={() => saveEdit(c.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(c)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {c.notes && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" title={c.notes}>
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    {search.trim()
                      ? <EmptySearch query={search} />
                      : <EmptyClients onAdd={() => setAddOpen(true)} />
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <AddClientDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
