import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { MoneyCell } from '@/components/shared/MoneyCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { sum, type Category } from '@/lib/workbook';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { downloadCSV } from '@/lib/csv';
import { toast } from '@/hooks/use-toast';

interface CatDef {
  key: Category;
  labelKey: TranslationKey;
  stripe: string;
  pill: string;
}

const catDefs: CatDef[] = [
  { key: 'funds',     labelKey: 'cat.funds',     stripe: 'bg-orange-400',  pill: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300' },
  { key: 'banks',     labelKey: 'cat.banks',     stripe: 'bg-sky-400',     pill: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300' },
  { key: 'clients',   labelKey: 'cat.clients',   stripe: 'bg-pink-400',    pill: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300' },
  { key: 'suppliers', labelKey: 'cat.suppliers', stripe: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { key: 'partners',  labelKey: 'cat.partners',  stripe: 'bg-rose-400',    pill: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
  { key: 'staff',     labelKey: 'cat.staff',     stripe: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { key: 'revenue',   labelKey: 'cat.revenue',   stripe: 'bg-violet-400',  pill: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' },
  { key: 'expenses',  labelKey: 'cat.expenses',  stripe: 'bg-red-400',     pill: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
  { key: 'debts',     labelKey: 'cat.debts',     stripe: 'bg-teal-400',    pill: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300' },
];

export default function Report() {
  const { t, lang } = useTranslation();
  const accounts = useWorkbookStore((s) => s.accounts);
  const [params, setParams] = useSearchParams();
  const initialCat = (params.get('cat') as Category) ?? 'funds';
  const [activeCat, setActiveCat] = useState<Category>(initialCat);
  const [search, setSearch] = useState('');

  const currentDef = catDefs.find((c) => c.key === activeCat) ?? catDefs[0];
  const rows = useMemo(
    () => accounts.filter((a) => a.category === activeCat),
    [accounts, activeCat],
  );
  const total = useMemo(() => sum(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.arabic?.includes(q),
    );
  }, [search, rows]);

  const onSelectCat = (key: Category) => {
    setActiveCat(key);
    const p = new URLSearchParams(params);
    p.set('cat', key);
    setParams(p, { replace: true });
  };

  const handleExport = () => {
    downloadCSV(
      `report-${currentDef.key}-${new Date().toISOString().slice(0, 10)}`,
      [t('report.col.code'), t('report.col.account'), t('field.nameAr'), t('report.col.balance')],
      filtered.map((r) => [r.code, r.name, r.arabic ?? '', r.balance]),
    );
    toast({ title: t('toast.exported'), description: `${filtered.length} rows` });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('report.title')}
        subtitle={t('report.subtitle')}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> {t('action.export')}
          </Button>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap gap-1 p-3">
          {catDefs.map((c) => {
            const count = accounts.filter((a) => a.category === c.key).length;
            return (
              <button
                key={c.key}
                onClick={() => onSelectCat(c.key)}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  activeCat === c.key
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', c.stripe)} />
                <span>{t(c.labelKey)}</span>
                <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-[10px]">{count}</Badge>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <span className={cn('inline-block h-2.5 w-2.5 rounded-full', currentDef.stripe)} />
            <span>{t(currentDef.labelKey)}</span>
          </span>
        }
        description={t('report.accountsCount', { n: filtered.length })}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('action.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 ps-8 text-sm"
              />
            </div>
            <div className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums', currentDef.pill)}>
              {t('report.total')} <MoneyCell value={total} signColor={false} className="text-sm" bold />
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t('report.col.code')}</TableHead>
                <TableHead>{t('report.col.account')}</TableHead>
                <TableHead className="w-40 text-end">{t('report.col.balance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.code + r.name}>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</TableCell>
                  <TableCell className="font-medium" dir={lang === 'ar' && r.arabic ? 'rtl' : undefined}>
                    {lang === 'ar' && r.arabic ? r.arabic : r.name}
                  </TableCell>
                  <TableCell className="text-end">
                    <MoneyCell value={r.balance} bold />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                    {t('report.noMatch')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
