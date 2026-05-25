import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogOut, ChevronDown, BarChart3, DollarSign, Users, User,
  Bell, Sun, Moon, ChevronLeft, Info, ShieldAlert,
} from 'lucide-react';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getIBNotifications, markIBNotificationRead } from '@/api/ib.api';
import { cn } from '@/lib/utils';
import type { TranslationKey } from '@/lib/i18n/translations';

const navItems: { to: string; labelKey: TranslationKey; icon: typeof BarChart3 }[] = [
  { to: '/ib/dashboard',   labelKey: 'ib.nav.dashboard',   icon: BarChart3  },
  { to: '/ib/commissions', labelKey: 'ib.nav.commissions', icon: DollarSign },
  { to: '/ib/clients',     labelKey: 'ib.nav.clients',     icon: Users      },
  { to: '/ib/profile',     labelKey: 'ib.nav.profile',     icon: User       },
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Initials({ name }: { name: string }) {
  const p   = name.trim().split(' ');
  const ini = p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2);
  return (
    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white shadow-shadow-1 ring-2 ring-amber-500/20 select-none shrink-0">
      {ini.toUpperCase()}
    </div>
  );
}

export function IBLayout() {
  const { token, ibUser, logout }      = useIBAuthStore();
  const { theme, toggleTheme }         = useUIStore();
  const { t, lang, toggleLang }        = useTranslation();
  const navigate                       = useNavigate();
  const location                       = useLocation();
  const qc                             = useQueryClient();
  const [sidebarOpen, setSidebarOpen]  = useState(true);
  const [notifOpen, setNotifOpen]      = useState(false);
  const [menuOpen,  setMenuOpen]       = useState(false);
  const notifRef                       = useRef<HTMLDivElement>(null);
  const menuRef                        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) navigate('/ib/login', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['ib-notifications'],
    queryFn: getIBNotifications,
    enabled: !!token,
    refetchInterval: 60000,
  });

  const { mutate: doRead } = useMutation({
    mutationFn: markIBNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ib-notifications'] }),
  });

  if (!token) return null;

  const unread = notifications.filter((n) => !n.is_read).length;

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
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_12px_rgb(245_158_11/0.4)]">
            <span className="text-[13px] font-bold text-white">IB</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-sidebar-foreground tracking-tight">
                {t('app.name')}
              </p>
              <p className="truncate text-[11px] leading-tight text-amber-400 font-semibold">
                {t('ib.portal')}
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
                    ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-white font-semibold'
                    : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && sidebarOpen && (
                    <span className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-amber-500 shadow-[0_0_8px_rgb(245_158_11/0.6)]" />
                  )}
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  {sidebarOpen && <span className="truncate">{t(labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* IB level badge */}
        {sidebarOpen && ibUser && (
          <div className="border-t border-sidebar-border px-3 py-3">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">Level</p>
              <p className="text-[12px] font-semibold text-amber-400">{ibUser.level_label ?? 'Standard IB'}</p>
              <p className="text-[10px] text-sidebar-foreground/40">{ibUser.ib_code}</p>
            </div>
          </div>
        )}

        {/* User info at bottom */}
        {sidebarOpen && (
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
              <Initials name={ibUser?.full_name ?? 'IB'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight text-sidebar-foreground">
                  {ibUser?.full_name?.split(' ')[0]}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">{ibUser?.ib_code}</p>
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
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:border-amber-500/30"
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

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-shadow-1">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="card-glass absolute end-0 top-11 z-50 w-80 overflow-hidden animate-slide-up-sm">
                  <div className="flex items-center justify-between border-b border-border/40 bg-background/40 backdrop-blur px-4 py-3">
                    <p className="text-[13px] font-semibold">{t('nav.notifications')}</p>
                    {unread > 0 && (
                      <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-8 text-center text-[13px] text-muted-foreground">{t('nav.noNotifications')}</p>
                    ) : notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { if (!n.is_read) doRead(n.id); setNotifOpen(false); }}
                        className={cn(
                          'w-full text-left border-b border-border/40 last:border-0 px-4 py-3 hover:bg-accent/40 transition-colors',
                          !n.is_read && 'bg-accent/20',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.is_read ? <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" /> :
                           <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">{n.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.description}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-accent/60 transition-colors"
              >
                <Initials name={ibUser?.full_name ?? 'IB'} />
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold leading-tight">{ibUser?.full_name?.split(' ')[0]}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('ib.portal')}</p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
              </button>
              {menuOpen && (
                <div className="card-glass absolute end-0 top-12 z-50 w-56 overflow-hidden animate-slide-up-sm">
                  <div className="border-b border-border/40 px-4 py-3">
                    <p className="truncate text-[13px] font-semibold">{ibUser?.full_name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{ibUser?.ib_code} · {ibUser?.level_label}</p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/ib/login', { replace: true }); }}
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
