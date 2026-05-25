import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LogOut, ChevronDown, BarChart3, ArrowLeftRight, FileText,
  User, TrendingUp, Sun, Moon, ChevronLeft, Bell,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getClientAccounts } from '@/api/clientPortal.api';
import { cn } from '@/lib/utils';
import type { TranslationKey } from '@/lib/i18n/translations';

const navItems: { to: string; labelKey: TranslationKey; icon: typeof BarChart3 }[] = [
  { to: '/client/dashboard',    labelKey: 'client.nav.dashboard',    icon: BarChart3 },
  { to: '/client/trades',       labelKey: 'client.nav.trades',       icon: TrendingUp },
  { to: '/client/transactions', labelKey: 'client.nav.transactions', icon: ArrowLeftRight },
  { to: '/client/statements',   labelKey: 'client.nav.statements',   icon: FileText },
  { to: '/client/profile',      labelKey: 'client.nav.profile',      icon: User },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const ini   = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-shadow-1 ring-2 ring-emerald-500/20 select-none">
      {ini.toUpperCase()}
    </div>
  );
}

export function ClientLayout() {
  const { token, clientUser, selectedMt5Id, setSelectedMt5, logout } = useClientAuthStore();
  const { theme, toggleTheme }  = useUIStore();
  const { t, lang, toggleLang } = useTranslation();
  const navigate                = useNavigate();
  const location                = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) navigate('/client/login', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: accounts = [] } = useQuery({
    queryKey: ['client-accounts'],
    queryFn: getClientAccounts,
    enabled: !!token,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedMt5Id) setSelectedMt5(accounts[0].id);
  }, [accounts, selectedMt5Id, setSelectedMt5]);

  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'relative flex h-full flex-col border-e border-sidebar-border text-sidebar-foreground',
          'transition-[width] duration-300 ease-in-out bg-[hsl(var(--sidebar-background))]',
          sidebarOpen ? 'w-60' : 'w-[68px]',
        )}
        style={{ boxShadow: '4px 0 24px -8px rgba(0,0,0,0.25)' }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_12px_rgb(16_185_129/0.4)]">
            <span className="text-[13px] font-bold text-white">FX</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-sidebar-foreground tracking-tight">
                {t('app.name')}
              </p>
              <p className="truncate text-[11px] leading-tight text-emerald-400 font-semibold">
                {t('client.portal')}
              </p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className={cn(
            'absolute -end-3 top-[72px] z-10',
            'flex h-6 w-6 items-center justify-center rounded-full',
            'bg-[hsl(var(--sidebar-background))] border border-sidebar-border text-sidebar-foreground/50',
            'shadow-shadow-2 hover:text-sidebar-foreground transition-colors duration-150',
          )}
        >
          <ChevronLeft className={cn('h-3 w-3 transition-transform duration-300 rtl:rotate-180', !sidebarOpen && 'rotate-180 rtl:rotate-0')} />
        </button>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={t(labelKey)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/25 to-emerald-500/10 text-white font-semibold'
                    : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && sidebarOpen && (
                    <span className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129/0.6)]" />
                  )}
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  {sidebarOpen && <span className="truncate">{t(labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Account selector in sidebar */}
        {sidebarOpen && accounts.length > 1 && (
          <div className="border-t border-sidebar-border px-3 py-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">MT5 Account</p>
            <Select value={selectedMt5Id ?? accounts[0]?.id} onValueChange={setSelectedMt5}>
              <SelectTrigger className="h-8 w-full border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.mt5_login} · {a.account_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* User info at bottom */}
        {sidebarOpen && (
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
              <Initials name={clientUser?.full_name ?? 'U'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight text-sidebar-foreground">
                  {clientUser?.full_name?.split(' ')[0]}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">{clientUser?.client_code}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {/* Language */}
            <button
              onClick={toggleLang}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:border-primary/30"
            >
              <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
              <span>{lang === 'en' ? 'EN' : 'عر'}</span>
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notification placeholder */}
            <button className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            {/* User menu */}
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-accent/60 transition-colors"
              >
                <Initials name={clientUser?.full_name ?? 'U'} />
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold leading-tight">{clientUser?.full_name?.split(' ')[0]}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('client.portal')}</p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
              </button>
              {userMenuOpen && (
                <div className="card-glass absolute end-0 top-12 z-50 w-56 overflow-hidden animate-slide-up-sm">
                  <div className="border-b border-border/40 px-4 py-3">
                    <p className="truncate text-[13px] font-semibold">{clientUser?.full_name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{clientUser?.client_code}</p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/client/login', { replace: true }); }}
                    className="flex w-full items-center gap-2 border-t border-border/40 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto gradient-bg-soft px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <div key={location.pathname} className="animate-slide-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
