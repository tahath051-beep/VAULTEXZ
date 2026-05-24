import { useMemo, useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { AddAccountButton } from '@/components/shared/AddRowModals';
import { cn } from '@/lib/utils';

type Cat = 'funds' | 'banks' | 'clients' | 'suppliers' | 'partners' | 'staff' | 'revenue' | 'expenses' | 'debts' | 'platform';

const CURRENCIES = ['USD', 'LBP', 'EUR', 'TRY', 'GBP'] as const;

const catMeta: Record<Cat, { labelKey: TranslationKey; tone: string }> = {
  funds:     { labelKey: 'cat.funds',     tone: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300' },
  banks:     { labelKey: 'cat.banks',     tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300' },
  clients:   { labelKey: 'cat.clients',   tone: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300' },
  suppliers: { labelKey: 'cat.suppliers', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
  partners:  { labelKey: 'cat.partners',  tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
  staff:     { labelKey: 'cat.staff',     tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  revenue:   { labelKey: 'cat.revenue',   tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' },
  expenses:  { labelKey: 'cat.expenses',  tone: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
  debts:     { labelKey: 'cat.debts',     tone: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300' },
  platform:  { labelKey: 'cat.platform',  tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300' },
};

export default function Data() {
  const { t, lang } = useTranslation();
  const accounts = useWorkbookStore((s) => s.accounts);
  const setAccountActive = useWorkbookStore((s) => s.setAccountActive);
  const updateAccountCurrency = useWorkbookStore((s) => s.updateAccountCurrency);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Cat | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (!showInactive && a.active === false) return false;
      if (catFilter !== 'ALL' && a.category !== catFilter) return false;
      if (!q) return true;
      return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.arabic?.includes(q);
    });
  }, [search, catFilter, accounts, showInactive]);

  const activeCount = accounts.filter((a) => a.active !== false).length;
  const inactiveCount = accounts.length - activeCount;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('data.title')}
        subtitle={t('data.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
              className={cn('gap-1.5 text-xs', showInactive && 'text-primary')}
            >
              {showInactive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {t('data.showInactive')}
              {inactiveCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{inactiveCount}</Badge>
              )}
            </Button>
            <AddAccountButton />
          </div>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('data.searchPh')}
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
            <button
              onClick={() => setCatFilter('ALL')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                catFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              {t('action.all')} ({activeCount})
            </button>
            {(Object.keys(catMeta) as Cat[]).filter((k) => k !== 'platform').map((k) => (
              <button
                key={k}
                onClick={() => setCatFilter(k)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  catFilter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
                )}
              >
                {t(catMeta[k].labelKey)}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('data.col.code')}</TableHead>
                <TableHead>{t('data.col.name')}</TableHead>
                <TableHead className="w-32">{t('data.col.parent')}</TableHead>
                <TableHead className="w-28">{t('data.col.curr')}</TableHead>
                <TableHead className="w-24 text-center">{t('data.col.active')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const meta = catMeta[a.category as Cat];
                const isInactive = a.active === false;
                return (
                  <TableRow key={a.code + a.name} className={cn(isInactive && 'opacity-40')}>
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{a.code}</TableCell>
                    <TableCell className="font-medium" dir={lang === 'ar' && a.arabic ? 'rtl' : undefined}>
                      {lang === 'ar' && a.arabic ? a.arabic : a.name}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', meta.tone)}>
                        {t(meta.labelKey)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <select
                        value={a.currency ?? 'USD'}
                        onChange={(e) => updateAccountCurrency(a.code, e.target.value)}
                        className="rounded-md border border-border/60 bg-card px-2 py-0.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => setAccountActive(a.code, !isInactive)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                          isInactive ? 'bg-muted' : 'bg-emerald-500',
                        )}
                        role="switch"
                        aria-checked={!isInactive}
                      >
                        <span className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                          isInactive ? 'translate-x-0' : 'translate-x-4',
                        )} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
