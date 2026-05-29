import { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Lock, Search, Download,
  TrendingUp, TrendingDown, Landmark, BarChart3, Receipt, BookOpen, Globe,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { downloadCSV } from '@/lib/csv';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  COA_ACCOUNTS, ROOT_CODES,
  type CoaAccount, type CoaCategory,
} from '@/lib/coa';

// ─── Palette ─────────────────────────────────────────────────────────────────

type SectionMeta = {
  labelEn: string;
  labelAr: string;
  icon: typeof TrendingUp;
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  '1000': {
    labelEn: 'Assets', labelAr: 'الأصول',
    icon: TrendingUp,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  '2000': {
    labelEn: 'Liabilities', labelAr: 'الخصوم',
    icon: TrendingDown,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  '3000': {
    labelEn: 'Equity', labelAr: 'حقوق الملكية',
    icon: Landmark,
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',
    dot: 'bg-violet-500',
  },
  '4000': {
    labelEn: 'Revenue', labelAr: 'الإيرادات',
    icon: BarChart3,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  '5000': {
    labelEn: 'Expenses', labelAr: 'المصروفات',
    icon: Receipt,
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    dot: 'bg-rose-500',
  },
  '9000': {
    labelEn: 'Off-Balance', labelAr: 'خارج الميزانية',
    icon: BookOpen,
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    dot: 'bg-slate-500',
  },
};

const CATEGORY_LABEL: Record<CoaCategory, { en: string; ar: string }> = {
  header:       { en: 'Header',      ar: 'تصنيف'      },
  asset:        { en: 'Asset',       ar: 'أصل'         },
  liability:    { en: 'Liability',   ar: 'خصم'         },
  equity:       { en: 'Equity',      ar: 'ملكية'       },
  revenue:      { en: 'Revenue',     ar: 'إيراد'       },
  expense:      { en: 'Expense',     ar: 'مصروف'       },
  'off-balance':{ en: 'Off-Balance', ar: 'خارج ميزانية'},
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getChildren(parentCode: string) {
  return COA_ACCOUNTS.filter((a) => a.parent === parentCode);
}

function countLeaves(code: string): number {
  const children = getChildren(code);
  if (children.length === 0) return 1;
  return children.reduce((s, c) => s + countLeaves(c.code), 0);
}

function getAllDescendantCodes(code: string): Set<string> {
  const result = new Set<string>();
  const visit = (c: string) => {
    result.add(c);
    for (const child of getChildren(c)) visit(child.code);
  };
  visit(code);
  return result;
}

function matchesSearch(a: CoaAccount, q: string): boolean {
  return (
    a.code.includes(q) ||
    a.name_en.toLowerCase().includes(q) ||
    a.name_ar.includes(q)
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ rootCode, lang }: { rootCode: string; lang: 'en' | 'ar' }) {
  const meta = SECTION_META[rootCode];
  const Icon = meta.icon;
  const leaves = countLeaves(rootCode) - 1; // subtract root itself
  const label = lang === 'ar' ? meta.labelAr : meta.labelEn;

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-md',
      meta.bg, meta.border,
    )}>
      <div className={cn('rounded-xl p-2.5', meta.badge)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold uppercase tracking-wide', meta.text)}>{label}</p>
        <p className="text-2xl font-bold tabular-nums text-foreground">{leaves}</p>
        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'حساب' : 'accounts'}</p>
      </div>
    </div>
  );
}

// ─── Tree Row ────────────────────────────────────────────────────────────────

type TreeRowProps = {
  account: CoaAccount;
  depth: number;
  lang: 'en' | 'ar';
  expanded: Set<string>;
  toggleExpand: (code: string) => void;
  hasChildren: boolean;
  meta: SectionMeta;
  isVisible: boolean;
};

function TreeRow({ account: a, depth, lang, expanded, toggleExpand, hasChildren, meta, isVisible }: TreeRowProps) {
  if (!isVisible) return null;

  const isOpen = expanded.has(a.code);
  const isHeader = a.category === 'header';
  const name = lang === 'ar' ? a.name_ar : a.name_en;

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-border/30 px-4 py-2.5 transition-colors',
        isHeader
          ? cn('font-semibold text-sm', depth === 0 ? cn(meta.bg, meta.text, 'py-3 border-b-2', meta.border) : 'bg-muted/20 text-foreground')
          : 'hover:bg-accent/30 text-sm text-foreground',
      )}
      style={{ paddingInlineStart: `${1 + depth * 1.5}rem` }}
    >
      {/* expand/collapse toggle */}
      <button
        onClick={() => hasChildren && toggleExpand(a.code)}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors',
          hasChildren ? 'cursor-pointer hover:bg-accent text-muted-foreground' : 'cursor-default opacity-0',
        )}
        tabIndex={hasChildren ? 0 : -1}
        aria-label={isOpen ? 'Collapse' : 'Expand'}
      >
        {hasChildren && (isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
      </button>

      {/* code badge */}
      <span className={cn(
        'shrink-0 font-mono text-xs font-bold px-1.5 py-0.5 rounded',
        depth === 0 ? meta.badge : 'bg-muted text-muted-foreground',
      )}>
        {a.code}
      </span>

      {/* name */}
      <span className={cn('flex-1 truncate', lang === 'ar' && 'font-arabic', depth === 0 && meta.text)}>
        {name}
      </span>

      {/* system lock */}
      {a.is_system && (
        <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-label="System account" />
      )}

      {/* normal balance badge */}
      {a.normal_balance && (
        <span className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
          a.normal_balance === 'debit'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        )}>
          {a.normal_balance === 'debit' ? (lang === 'ar' ? 'مدين' : 'DR') : (lang === 'ar' ? 'دائن' : 'CR')}
        </span>
      )}

      {/* category label for leaf accounts */}
      {!isHeader && (
        <span className="shrink-0 hidden sm:inline text-[10px] text-muted-foreground/60">
          {lang === 'ar' ? CATEGORY_LABEL[a.category].ar : CATEGORY_LABEL[a.category].en}
        </span>
      )}
    </div>
  );
}

// ─── Section Tree ─────────────────────────────────────────────────────────────

type SectionTreeProps = {
  rootCode: string;
  lang: 'en' | 'ar';
  searchQuery: string;
  expanded: Set<string>;
  toggleExpand: (code: string) => void;
  expandAll: (codes: string[]) => void;
};

function SectionTree({ rootCode, lang, searchQuery, expanded, toggleExpand, expandAll }: SectionTreeProps) {
  const meta = SECTION_META[rootCode];

  const visibleCodes = useMemo((): Set<string> => {
    if (!searchQuery) return new Set(COA_ACCOUNTS.map((a) => a.code));
    const matched = new Set<string>();
    for (const a of COA_ACCOUNTS) {
      if (matchesSearch(a, searchQuery)) {
        matched.add(a.code);
        // bubble up ancestors
        let cur: CoaAccount | undefined = a;
        while (cur?.parent) {
          matched.add(cur.parent);
          cur = COA_ACCOUNTS.find((x) => x.code === cur!.parent);
        }
      }
    }
    return matched;
  }, [searchQuery]);

  // auto-expand when searching
  useMemo(() => {
    if (searchQuery) {
      expandAll([...visibleCodes]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const renderNode = useCallback((code: string, depth: number): React.ReactNode => {
    const account = COA_ACCOUNTS.find((a) => a.code === code);
    if (!account) return null;

    const children = getChildren(code);
    const hasChildren = children.length > 0;
    const isOpen = expanded.has(code);
    const isVisible = visibleCodes.has(code);

    return (
      <div key={code}>
        <TreeRow
          account={account}
          depth={depth}
          lang={lang}
          expanded={expanded}
          toggleExpand={toggleExpand}
          hasChildren={hasChildren}
          meta={meta}
          isVisible={isVisible}
        />
        {hasChildren && isOpen && (
          <div>
            {children.map((c) => renderNode(c.code, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expanded, lang, meta, toggleExpand, visibleCodes]);

  const root = COA_ACCOUNTS.find((a) => a.code === rootCode);
  if (!root || !visibleCodes.has(rootCode)) return null;

  const leafCount = countLeaves(rootCode) - 1;
  const Icon = meta.icon;

  return (
    <SectionCard padded={false} className="overflow-hidden">
      {/* Section header bar */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', meta.bg, meta.border)}>
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-1.5', meta.badge)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className={cn('font-bold text-sm', meta.text)}>
              {lang === 'ar' ? meta.labelAr : meta.labelEn}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {rootCode} · {leafCount} {lang === 'ar' ? 'حساب' : 'accounts'}
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleExpand(rootCode)}
          className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', meta.badge, 'hover:opacity-80')}
        >
          {expanded.has(rootCode) ? (
            <><ChevronDown className="h-3 w-3" />{lang === 'ar' ? 'طي' : 'Collapse'}</>
          ) : (
            <><ChevronRight className="h-3 w-3" />{lang === 'ar' ? 'توسيع' : 'Expand'}</>
          )}
        </button>
      </div>

      {/* Tree rows */}
      {expanded.has(rootCode) && (
        <div>
          {getChildren(rootCode).map((child) => renderNode(child.code, 1))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChartOfAccounts() {
  const { lang, toggleLang } = useTranslation();

  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(ROOT_CODES) // root sections open by default
  );

  const toggleExpand = useCallback((code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        // collapse this node and all descendants
        const desc = getAllDescendantCodes(code);
        desc.forEach((c) => next.delete(c));
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((codes: string[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => next.add(c));
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(ROOT_CODES));
  }, []);

  const expandEverything = useCallback(() => {
    setExpanded(new Set(COA_ACCOUNTS.map((a) => a.code)));
  }, []);

  const searchQuery = search.trim().toLowerCase();

  const visibleRoots = activeSection === 'ALL'
    ? ROOT_CODES
    : ROOT_CODES.filter((c) => c === activeSection);

  const handleExport = () => {
    downloadCSV(
      `chart-of-accounts-${new Date().toISOString().slice(0, 10)}`,
      ['Code', 'Name EN', 'Name AR', 'Category', 'Normal Balance', 'Parent', 'System'],
      COA_ACCOUNTS.map((a) => [
        a.code, a.name_en, a.name_ar, a.category,
        a.normal_balance ?? '', a.parent ?? '', a.is_system ? 'Yes' : '',
      ]),
    );
    toast({ title: lang === 'ar' ? 'تم التصدير' : 'Exported', description: `${COA_ACCOUNTS.length} accounts` });
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title={lang === 'ar' ? 'دليل الحسابات' : 'Chart of Accounts'}
        subtitle={lang === 'ar' ? 'هيكل الحسابات المحاسبية لشركة الوساطة' : 'Full accounting structure for the forex brokerage'}
        hint={
          <PageHint id="chart-of-accounts" title={lang === 'ar' ? 'دليل الحسابات' : 'Chart of Accounts'}>
            {lang === 'ar'
              ? 'يعرض هذا الدليل جميع الحسابات المحاسبية المنظمة هرمياً. الحسابات المقفلة هي حسابات نظام لا يمكن تعديلها.'
              : 'This chart displays all accounting accounts organized hierarchically. Locked accounts are system accounts that cannot be modified.'}
          </PageHint>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold"
              onClick={toggleLang}
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'EN' : 'ع'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'تصدير' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ROOT_CODES.map((code) => (
          <StatCard key={code} rootCode={code} lang={lang as 'en' | 'ar'} />
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث برقم أو اسم الحساب…' : 'Search by code or name…'}
              className="ps-9"
            />
          </div>

          {/* Section filter pills */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveSection('ALL')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                activeSection === 'ALL'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            {ROOT_CODES.map((code) => {
              const meta = SECTION_META[code];
              const label = lang === 'ar' ? meta.labelAr : meta.labelEn;
              return (
                <button
                  key={code}
                  onClick={() => setActiveSection(code)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    activeSection === code
                      ? cn(meta.badge, 'ring-1 ring-inset', meta.border)
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse all */}
          <div className="flex items-center gap-1 ms-auto">
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={expandEverything}>
              {lang === 'ar' ? 'توسيع الكل' : 'Expand All'}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={collapseAll}>
              {lang === 'ar' ? 'طي الكل' : 'Collapse All'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── Tree Sections ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        {visibleRoots.map((rootCode) => (
          <SectionTree
            key={rootCode}
            rootCode={rootCode}
            lang={lang as 'en' | 'ar'}
            searchQuery={searchQuery}
            expanded={expanded}
            toggleExpand={toggleExpand}
            expandAll={expandAll}
          />
        ))}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{lang === 'ar' ? 'المفتاح:' : 'Legend:'}</span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            {lang === 'ar' ? 'حساب نظام (غير قابل للتعديل)' : 'System account (read-only)'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {lang === 'ar' ? 'مدين' : 'DR'}
            </span>
            {lang === 'ar' ? 'رصيد مدين طبيعي' : 'Normal debit balance'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {lang === 'ar' ? 'دائن' : 'CR'}
            </span>
            {lang === 'ar' ? 'رصيد دائن طبيعي' : 'Normal credit balance'}
          </span>
          <span className="ms-auto tabular-nums text-muted-foreground">
            {lang === 'ar' ? `إجمالي ${COA_ACCOUNTS.length} حساب` : `${COA_ACCOUNTS.length} total accounts`}
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
