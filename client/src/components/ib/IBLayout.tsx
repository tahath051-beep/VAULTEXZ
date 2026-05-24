import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, ChevronDown, BarChart3, DollarSign, Users, User, Bell, Sun, Moon } from 'lucide-react';
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
    <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xs font-bold select-none shrink-0 shadow-shadow-1 ring-2 ring-amber-500/20">
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
    <div className="min-h-screen bg-background gradient-bg-soft">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-shadow-1">
                <span className="text-white font-bold text-[13px] tracking-tight">IB</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-foreground text-[13px] leading-tight">{t('app.name')}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold leading-tight">{t('ib.portal')}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 justify-center">
              {navItems.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-150',
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{t(labelKey)}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language toggle */}
              <button
                onClick={toggleLang}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all duration-150 hover:bg-accent hover:border-amber-500/30 hover:shadow-shadow-1"
              >
                <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
                <span>{lang === 'en' ? 'EN' : 'عر'}</span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-shadow-1">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="card-glass absolute end-0 top-11 z-50 w-80 overflow-hidden animate-slide-up-sm">
                    <div className="px-4 py-3 border-b border-border/40 bg-background/40 backdrop-blur flex items-center justify-between">
                      <p className="text-[13px] font-semibold">{t('nav.notifications')}</p>
                      {unread > 0 && <span className="text-[11px] text-muted-foreground">{unread} unread</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground text-center py-6">{t('nav.noNotifications')}</p>
                      ) : notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.is_read) doRead(n.id); }}
                          className={cn(
                            'w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-accent/40 transition-colors',
                            !n.is_read && 'bg-amber-500/5',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', !n.is_read ? 'bg-amber-500' : 'bg-transparent')} />
                            <div>
                              <p className="text-[13px] font-semibold">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{n.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-accent/60 transition-colors duration-150"
                >
                  <Initials name={ibUser?.full_name ?? 'IB'} />
                  <span className="hidden sm:block text-[13px] font-semibold text-foreground max-w-[6rem] truncate">
                    {ibUser?.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="card-glass absolute end-0 top-12 z-50 w-52 overflow-hidden animate-slide-up-sm">
                    <div className="px-4 py-3 border-b border-border/40">
                      <p className="text-[13px] font-semibold">{ibUser?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{ibUser?.ib_code} · {ibUser?.level_label}</p>
                    </div>
                    <button
                      onClick={() => { logout(); navigate('/ib/login', { replace: true }); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div key={location.pathname} className="animate-slide-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
