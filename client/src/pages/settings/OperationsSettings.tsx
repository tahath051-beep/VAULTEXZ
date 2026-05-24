import { useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOperationsStore } from '@/stores/operations.store';
import { useClientsStore } from '@/stores/clients.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-emerald-500' : 'bg-muted',
        )}
        role="switch"
        aria-checked={checked}
      >
        <span className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )} />
      </button>
    </div>
  );
}

export default function OperationsSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useOperationsStore();
  const { ibClassifications, addIBClassification, removeIBClassification } = useClientsStore();
  const { toast } = useToast();
  const [newClass, setNewClass] = useState('');

  const handleAddClass = () => {
    const trimmed = newClass.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed || ibClassifications.includes(trimmed)) return;
    addIBClassification(trimmed);
    setNewClass('');
    toast({ title: `Classification "${trimmed}" added` });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('settings.ops')}
        subtitle={t('ops.requests.subtitle')}
        actions={<Settings2 className="h-5 w-5 text-muted-foreground" />}
      />

      {/* Workflow settings */}
      <SectionCard title="Workflow">
        <div className="space-y-3">
          <Toggle
            checked={settings.requireDifferentConfirmer}
            onChange={(v) => updateSettings({ requireDifferentConfirmer: v })}
            label={t('settings.ops.requireDiff')}
            description={t('settings.ops.requireDiffDesc')}
          />
          <Toggle
            checked={settings.manualMT5Execution}
            onChange={(v) => updateSettings({ manualMT5Execution: v })}
            label={t('settings.ops.manualMT5')}
            description={t('settings.ops.manualMT5Desc')}
          />
          <Toggle
            checked={settings.digitalWalletMode}
            onChange={(v) => updateSettings({ digitalWalletMode: v })}
            label={t('settings.ops.digitalWallet')}
            description={t('settings.ops.digitalWalletDesc')}
          />
        </div>
      </SectionCard>

      {/* Threshold settings */}
      <SectionCard title="Alert Thresholds">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('settings.ops.urgentHours')}</label>
            <Input
              type="number"
              min="1"
              max="72"
              value={settings.urgentThresholdHours}
              onChange={(e) => updateSettings({ urgentThresholdHours: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('settings.ops.largeThreshold')}</label>
            <Input
              type="number"
              min="100"
              step="500"
              value={settings.largeTransactionThreshold}
              onChange={(e) => updateSettings({ largeTransactionThreshold: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      {/* IB Classifications */}
      <SectionCard title={t('settings.ops.ibClasses')}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ibClassifications.map((cls) => (
              <div key={cls} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
                <span className="font-medium">{cls.replace(/_/g, ' ')}</span>
                {ibClassifications.length > 1 && (
                  <button
                    onClick={() => removeIBClassification(cls)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              placeholder="new_classification"
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
            />
            <Button variant="outline" size="sm" onClick={handleAddClass} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t('settings.ops.addClass')}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
