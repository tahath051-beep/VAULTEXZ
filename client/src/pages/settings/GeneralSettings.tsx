import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionCard } from '@/components/shared/SectionCard';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const TIMEZONES = [
  'UTC', 'US/Eastern', 'US/Pacific', 'Europe/London',
  'Europe/Frankfurt', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Singapore', 'Asia/Tokyo',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'TRY'];

/* ── Period Locking ────────────────────────────────────────── */
function PeriodLockSection() {
  const { lockedPeriods, lockPeriod, unlockPeriod } = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const today = new Date();
  const presets = [
    { label: format(subMonths(today, 1), 'MMMM yyyy'), from: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd') },
    { label: format(subMonths(today, 2), 'MMMM yyyy'), from: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(today, 2)), 'yyyy-MM-dd') },
    { label: `Q${Math.ceil((today.getMonth() + 1) / 3) - 1} ${today.getFullYear()}`, from: '', to: '' },
  ];

  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const handleLockPreset = (p: typeof presets[0]) => {
    if (!p.from) { toast({ title: 'Select a custom range instead', variant: 'destructive' }); return; }
    const already = lockedPeriods.some((lp) => lp.from === p.from);
    if (already) { toast({ title: 'Period already locked' }); return; }
    lockPeriod(p.from, p.to, p.label, user?.email ?? 'admin');
    toast({ title: `🔒 ${p.label} locked`, description: 'No entries can be backdated into this period.' });
  };

  const handleLockCustom = () => {
    if (!customFrom || !customTo || !customLabel) { toast({ title: 'Fill all fields', variant: 'destructive' }); return; }
    if (customFrom > customTo) { toast({ title: 'From date must be before To date', variant: 'destructive' }); return; }
    lockPeriod(customFrom, customTo, customLabel, user?.email ?? 'admin');
    toast({ title: `🔒 ${customLabel} locked` });
    setCustomFrom(''); setCustomTo(''); setCustomLabel('');
  };

  return (
    <SectionCard title="Period Locking" description="Lock accounting periods to prevent backdated entries.">
      <div className="space-y-5">
        {/* Quick lock presets */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quick Lock</p>
          <div className="flex flex-wrap gap-2">
            {presets.filter((p) => p.from).map((p) => {
              const isLocked = lockedPeriods.some((lp) => lp.from === p.from);
              return (
                <button
                  key={p.label}
                  onClick={() => isLocked ? undefined : handleLockPreset(p)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
                    isLocked
                      ? 'border-destructive/30 bg-destructive/10 text-destructive cursor-default'
                      : 'border-border hover:bg-accent hover:text-foreground cursor-pointer',
                  )}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom range */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Range</p>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Label</Label><Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. Q1 2026" /></div>
            <div><Label className="text-xs">From</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
          </div>
          <Button size="sm" variant="outline" onClick={handleLockCustom} className="gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Lock Period
          </Button>
        </div>

        {/* Locked periods list */}
        {lockedPeriods.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked Periods</p>
            {lockedPeriods.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Lock className="h-3.5 w-3.5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.from} → {p.to} · Locked by {p.lockedBy}</p>
                  </div>
                </div>
                <button
                  onClick={() => { unlockPeriod(p.id); toast({ title: `🔓 ${p.label} unlocked` }); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Unlock period"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {lockedPeriods.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            No periods are locked. All dates are open for entries.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ── Main component ────────────────────────────────────────── */
export default function GeneralSettings() {
  const { general, updateGeneral } = useSettingsStore();
  const { toast } = useToast();

  const [form, setForm] = useState(general);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  const handleSave = () => {
    updateGeneral(form);
    toast({ title: '✓ Settings saved', description: 'General settings updated successfully.' });
  };

  const addEmail = () => {
    if (!emailInput.includes('@')) { toast({ title: 'Invalid email', variant: 'destructive' }); return; }
    if (!emails.includes(emailInput)) setEmails((e) => [...e, emailInput]);
    setEmailInput('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Broker Info */}
      <SectionCard title="Broker Configuration" description="Core platform settings for your brokerage.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Broker Name</Label>
              <Input value={form.brokerName} onChange={(e) => setForm((f) => ({ ...f, brokerName: e.target.value }))} placeholder="Vaultex FX" />
            </div>
            <div>
              <Label>Default Currency</Label>
              <Select value={form.defaultCurrency} onValueChange={(v) => setForm((f) => ({ ...f, defaultCurrency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>EOD Schedule Time</Label>
              <Input type="time" value={form.eodScheduleTime} onChange={(e) => setForm((f) => ({ ...f, eodScheduleTime: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reconciliation Threshold (%)</Label>
              <Input type="number" min="0" max="10" step="0.1" value={form.reconciliationThreshold} onChange={(e) => setForm((f) => ({ ...f, reconciliationThreshold: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <button
                role="switch"
                aria-checked={form.requireDualApproval}
                onClick={() => setForm((f) => ({ ...f, requireDualApproval: !f.requireDualApproval }))}
                className={cn('relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors', form.requireDualApproval ? 'bg-primary' : 'bg-muted')}
              >
                <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', form.requireDualApproval ? 'translate-x-4' : 'translate-x-0')} />
              </button>
              <Label className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, requireDualApproval: !f.requireDualApproval }))}>
                Require Dual Approval
              </Label>
            </div>
          </div>

          {/* Report delivery emails */}
          <div>
            <Label>Report Delivery Emails</Label>
            <div className="mt-1.5 flex gap-2">
              <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }} placeholder="reports@example.com" />
              <Button type="button" size="sm" variant="outline" onClick={addEmail}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {emails.map((em) => (
                  <span key={em} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {em}
                    <button onClick={() => setEmails((e) => e.filter((x) => x !== em))} className="ml-0.5 text-muted-foreground hover:text-foreground"><AlertTriangle className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} variant="gradient">Save Settings</Button>
          </div>
        </div>
      </SectionCard>

      {/* Period Locking */}
      <PeriodLockSection />
    </div>
  );
}
