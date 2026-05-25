import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SectionCard } from '@/components/shared/SectionCard';
import { MoneyCell } from '@/components/shared/MoneyCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { openingBalances } from '@/lib/workbook';

export default function Opening() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return openingBalances;
    return openingBalances.filter(
      (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.arabic?.includes(q),
    );
  }, [search]);

  const totalOpening = filtered.reduce((acc, r) => acc + r.opening, 0);
  const totalCredit  = filtered.reduce((acc, r) => acc + (r.creditLimit ?? 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('opening.title')}
        subtitle={t('opening.subtitle2')}
        hint={
          <PageHint id="opening" title={t('hint.opening.title')}>
            {t('hint.opening.body')}
          </PageHint>
        }
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard title="Total opening" description="Sum across all accounts" bodyClassName="p-5">
          <MoneyCell value={totalOpening} bold className="text-2xl" />
        </SectionCard>
        <SectionCard title="Credit limits granted" description="Sum across all accounts" bodyClassName="p-5">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </SectionCard>
        <SectionCard title="Accounts tracked" description="With opening balance entry" bodyClassName="p-5">
          <span className="text-2xl font-bold tabular-nums text-foreground">{openingBalances.length}</span>
        </SectionCard>
      </div>

      <SectionCard
        title="Opening register"
        action={
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search account…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="hidden md:table-cell">Arabic</TableHead>
                <TableHead className="w-40 text-right">Opening</TableHead>
                <TableHead className="w-40 text-right">Credit limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.code + r.name}>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell" dir="rtl">{r.arabic}</TableCell>
                  <TableCell className="text-right"><MoneyCell value={r.opening} bold /></TableCell>
                  <TableCell className="text-right">
                    {r.creditLimit
                      ? <span className="font-semibold tabular-nums text-foreground">${r.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
