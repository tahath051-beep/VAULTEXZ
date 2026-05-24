import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  ListTree,
  BookOpen,
  Database,
  Wallet,
  Receipt,
  Coins,
  Plus,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

const sheets: { to: string; labelKey: TranslationKey; icon: typeof LayoutGrid; tone: string }[] = [
  { to: '/',         labelKey: 'sheet.equity',   icon: LayoutGrid, tone: 'border-t-orange-400' },
  { to: '/entries',  labelKey: 'sheet.entries',  icon: ListTree,   tone: 'border-t-pink-400' },
  { to: '/report',   labelKey: 'sheet.report',   icon: BookOpen,   tone: 'border-t-sky-400' },
  { to: '/data',     labelKey: 'sheet.data',     icon: Database,   tone: 'border-t-emerald-400' },
  { to: '/opening',  labelKey: 'sheet.opening',  icon: Wallet,     tone: 'border-t-violet-400' },
  { to: '/vouchers', labelKey: 'sheet.vouchers', icon: Receipt,    tone: 'border-t-amber-400' },
  { to: '/currency', labelKey: 'sheet.currency', icon: Coins,      tone: 'border-t-teal-400' },
];

export function SheetTabsBar() {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-0 z-30 flex h-10 shrink-0 items-center gap-1 border-t border-border/70 bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="All sheets"
      >
        <Menu className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="New sheet"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="mx-1 h-5 w-px bg-border/70" />

      <nav className="flex h-full items-stretch gap-0.5 overflow-x-auto">
        {sheets.map(({ to, labelKey, icon: Icon, tone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group inline-flex h-full items-center gap-1.5 whitespace-nowrap border-t-2 border-transparent px-3 text-xs font-medium transition-colors',
                isActive
                  ? cn(
                      'bg-card text-foreground shadow-[0_-1px_0_hsl(var(--border)/0.7),inset_0_0_0_1px_hsl(var(--border)/0.4)] rounded-t-md',
                      tone,
                    )
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
