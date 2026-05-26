import { useState } from 'react';
import { Plus, Trash2, Settings2, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOperationsStore } from '@/stores/operations.store';
import { useClientsStore } from '@/stores/clients.store';
import { useOpModuleStore, MOCK_ACCOUNTS } from '@/stores/opModule.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors', checked ? 'bg-emerald-500' : 'bg-muted')}
        role="switch" aria-checked={checked}
      >
        <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
      </button>
    </div>
  );
}

export default function OperationsSettings() {
  const { t, lang } = useTranslation();
  const { settings, updateSettings } = useOperationsStore();
  const { ibClassifications, addIBClassification, removeIBClassification } = useClientsStore();
  const { settings: opSettings, updateSettings: updateOpSettings, paymentMethods, addPaymentMethod, togglePaymentMethod, exchangeRates, addExchangeRate } = useOpModuleStore();
  const { toast } = useToast();

  const [newClass, setNewClass] = useState('');

  // Add payment method dialog
  const [pmOpen, setPmOpen] = useState(false);
  const [pmNameAr, setPmNameAr] = useState('');
  const [pmNameEn, setPmNameEn] = useState('');
  const [pmAccountId, setPmAccountId] = useState('');

  // Add exchange rate dialog
  const [rateOpen, setRateOpen] = useState(false);
  const [rateCurrency, setRateCurrency] = useState('USD');
  const [rateValue, setRateValue] = useState('1');
  const [rateDate, setRateDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAddClass = () => {
    const trimmed = newClass.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed || ibClassifications.includes(trimmed)) return;
    addIBClassification(trimmed);
    setNewClass('');
    toast({ title: `Classification "${trimmed}" added` });
  };

  const handleAddPaymentMethod = () => {
    if (!pmNameAr || !pmNameEn || !pmAccountId) return;
    const acc = MOCK_ACCOUNTS.find((a) => a.id === pmAccountId);
    addPaymentMethod({ name_ar: pmNameAr, name_en: pmNameEn, account_id: pmAccountId, account_name: acc?.name ?? pmAccountId, is_active: true });
    toast({ title: lang === 'ar' ? 'تمت إضافة طريقة الدفع' : 'Payment method added' });
    setPmNameAr(''); setPmNameEn(''); setPmAccountId('');
    setPmOpen(false);
  };

  const handleAddRate = () => {
    if (!rateCurrency || !rateValue || !rateDate) return;
    addExchangeRate({ currency_code: rateCurrency, rate_to_usd: parseFloat(rateValue), rate_date: rateDate, source: 'manual', created_by: 'admin' });
    toast({ title: lang === 'ar' ? 'تم حفظ سعر الصرف' : 'Exchange rate saved' });
    setRateOpen(false);
  };

  // Get sorted/deduped rates (latest per currency)
  const latestRates = Object.values(
    exchangeRates.reduce((acc, r) => {
      const key = `${r.currency_code}-${r.rate_date}`;
      if (!acc[key] || acc[key].created_at < r.created_at) acc[key] = r;
      return acc;
    }, {} as Record<string, typeof exchangeRates[0]>)
  ).sort((a, b) => b.rate_date.localeCompare(a.rate_date));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('settings.ops')}
        subtitle={t('settings.ops.subtitle2')}
        hint={
          <PageHint id="settings-operations" title={t('settings.ops.hint.title')}>
            {t('settings.ops.hint.body')}
          </PageHint>
        }
        actions={<Settings2 className="h-5 w-5 text-muted-foreground" />}
      />

      {/* ── Existing workflow settings ─────────────────────────────────── */}
      <SectionCard title={t('settings.ops.workflow')}>
        <div className="space-y-3">
          <Toggle checked={settings.requireDifferentConfirmer} onChange={(v) => updateSettings({ requireDifferentConfirmer: v })} label={t('settings.ops.requireDiff')} description={t('settings.ops.requireDiffDesc')} />
          <Toggle checked={settings.manualMT5Execution}       onChange={(v) => updateSettings({ manualMT5Execution: v })}       label={t('settings.ops.manualMT5')}    description={t('settings.ops.manualMT5Desc')} />
          <Toggle checked={settings.digitalWalletMode}        onChange={(v) => updateSettings({ digitalWalletMode: v })}        label={t('settings.ops.digitalWallet')} description={t('settings.ops.digitalWalletDesc')} />
        </div>
      </SectionCard>

      <SectionCard title={t('settings.ops.alertThresholds')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('settings.ops.urgentHours')}</label>
            <Input type="number" min="1" max="72" value={settings.urgentThresholdHours} onChange={(e) => updateSettings({ urgentThresholdHours: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('settings.ops.largeThreshold')}</label>
            <Input type="number" min="100" step="500" value={settings.largeTransactionThreshold} onChange={(e) => updateSettings({ largeTransactionThreshold: Number(e.target.value) })} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('settings.ops.ibClasses')}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ibClassifications.map((cls) => (
              <div key={cls} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
                <span className="font-medium">{cls.replace(/_/g, ' ')}</span>
                {ibClassifications.length > 1 && (
                  <button onClick={() => removeIBClassification(cls)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="new_classification" className="max-w-xs" onKeyDown={(e) => e.key === 'Enter' && handleAddClass()} />
            <Button variant="outline" size="sm" onClick={handleAddClass} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> {t('settings.ops.addClass')}</Button>
          </div>
        </div>
      </SectionCard>

      {/* ── NEW: Operations Module Settings ───────────────────────────── */}
      <SectionCard title={t('opmod.settings.title')}>
        <div className="space-y-4">
          {/* Wallet mode */}
          <Toggle
            checked={opSettings.wallet_mode_enabled}
            onChange={(v) => updateOpSettings({ wallet_mode_enabled: v })}
            label={t('opmod.settings.walletMode')}
            description={t('opmod.settings.walletDesc')}
          />

          {/* Agent range */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">{t('opmod.settings.agentRange')}</p>
            <p className="text-xs text-muted-foreground">{t('opmod.settings.agentHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('opmod.settings.agentFrom')}</label>
                <Input type="number" value={opSettings.agent_range_start} onChange={(e) => updateOpSettings({ agent_range_start: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('opmod.settings.agentTo')}</label>
                <Input type="number" value={opSettings.agent_range_end} onChange={(e) => updateOpSettings({ agent_range_end: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Exchange rate API URL */}
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('opmod.settings.rateApiUrl')}</label>
            <Input value={opSettings.exchange_rate_api_url} onChange={(e) => updateOpSettings({ exchange_rate_api_url: e.target.value })} placeholder="https://api.exchangerate.host/latest" />
          </div>
        </div>
      </SectionCard>

      {/* ── Payment Methods ────────────────────────────────────────────── */}
      <SectionCard
        title={t('opmod.settings.paymentMethods')}
        action={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setPmOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> {t('opmod.settings.addMethod')}
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('opmod.settings.nameAr')}</TableHead>
              <TableHead>{t('opmod.settings.nameEn')}</TableHead>
              <TableHead>{t('opmod.settings.linkedAccount')}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((pm) => (
              <TableRow key={pm.id}>
                <TableCell className="font-semibold">{pm.name_ar}</TableCell>
                <TableCell>{pm.name_en}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{pm.account_name}</TableCell>
                <TableCell>
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', pm.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                    {pm.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => togglePaymentMethod(pm.id)}>
                    {pm.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* ── Exchange Rates ─────────────────────────────────────────────── */}
      <SectionCard
        title={t('opmod.settings.exchangeRates')}
        action={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setRateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> {t('opmod.settings.addRate')}
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('opmod.settings.rateCurrency')}</TableHead>
              <TableHead className="text-right">{t('opmod.settings.rateValue')}</TableHead>
              <TableHead>{t('opmod.settings.rateDate')}</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Added By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestRates.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-bold">{r.currency_code}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{r.rate_to_usd.toFixed(6)}</TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">{r.rate_date}</TableCell>
                <TableCell>
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', r.source === 'api' ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground')}>
                    {r.source}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.created_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* ── Add Payment Method Dialog ──────────────────────────────────── */}
      <Dialog open={pmOpen} onOpenChange={setPmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('opmod.settings.addMethod')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.settings.nameAr')} *</label>
              <Input value={pmNameAr} onChange={(e) => setPmNameAr(e.target.value)} placeholder="نقدية" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.settings.nameEn')} *</label>
              <Input value={pmNameEn} onChange={(e) => setPmNameEn(e.target.value)} placeholder="Cash" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.settings.linkedAccount')} *</label>
              <div className="relative">
                <select value={pmAccountId} onChange={(e) => setPmAccountId(e.target.value)} className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pe-8 text-sm">
                  <option value="">— Select account —</option>
                  {MOCK_ACCOUNTS.filter((a) => !a.id.startsWith('mt5-') && !a.id.startsWith('ib-') && !a.id.startsWith('exp-')).map((a) => (
                    <option key={a.id} value={a.id}>[{a.code}] {lang === 'ar' ? a.name_ar : a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setPmOpen(false)}>{t('action.cancel')}</Button>
              <Button variant="gradient" size="sm" onClick={handleAddPaymentMethod} disabled={!pmNameAr || !pmNameEn || !pmAccountId}>{t('action.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Exchange Rate Dialog ───────────────────────────────────── */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('opmod.settings.addRate')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('opmod.settings.rateCurrency')}</label>
                <select value={rateCurrency} onChange={(e) => setRateCurrency(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {['USD', 'USDT', 'EUR', 'GBP', 'TRY', 'AED', 'LBP'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('opmod.settings.rateValue')}</label>
                <Input type="number" step="0.000001" min="0" value={rateValue} onChange={(e) => setRateValue(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('opmod.settings.rateDate')}</label>
              <Input type="date" value={rateDate} onChange={(e) => setRateDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setRateOpen(false)}>{t('action.cancel')}</Button>
              <Button variant="gradient" size="sm" onClick={handleAddRate}>{t('action.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
