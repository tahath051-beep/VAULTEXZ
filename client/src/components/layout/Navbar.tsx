import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, LogOut, Bell, Search, ChevronDown, UserCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { authLogout } from '@/api/auth.api';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import { InstallPWAButton } from '@/components/shared/InstallPWAButton';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useOperationsStore } from '@/stores/operations.store';

interface Notification {
  id: string; type: string; title: string; description: string; is_read: boolean; created_at: string;
}

const alertColors: Record<string, string> = {
  RECON_BREAK:          'bg-destructive',
  NEGATIVE_BALANCE:     'bg-destructive',
  JOURNAL_FAILED:       'bg-destructive',
  LARGE_WITHDRAWAL:     'bg-warning',
  LP_STATEMENT_MISSING: 'bg-warning',
  IB_PAYOUT_DUE:        'bg-success',
};

const getNotifications = () =>
  api.get<{ success: boolean; data: { notifications: Notification[] } }>('/notifications')
    .then((r) => r.data.data.notifications);

const markRead    = (id: string) => api.patch(`/notifications/${id}/read`);
const markAllRead = ()           => api.patch('/notifications/read-all');

function timeAgo(dateStr: string) {
  const diffMs  = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const ini   = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="grid h-8 w-8 place-items-center rounded-xl gradient-bg text-xs font-bold text-white shadow-shadow-1 ring-2 ring-primary/20">
      {ini.toUpperCase()}
    </div>
  );
}

export function Navbar({ onSearchClick }: { onSearchClick?: () => void }) {
  const { theme, toggleTheme }    = useUIStore();
  const { t, lang, toggleLang }   = useTranslation();
  const { user, token, logout }   = useAuthStore();
  const navigate                  = useNavigate();
  const qc                        = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const panelRef                  = useRef<HTMLDivElement>(null);
  const userRef                   = useRef<HTMLDivElement>(null);

  const { alerts, markAlertRead } = useOperationsStore();
  const unreadSmartAlerts         = alerts.filter((a) => !a.read);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn:  getNotifications,
    refetchInterval: 60_000,
  });

  const unreadApiCount = notifications.filter((n) => !n.is_read).length;
  const unreadCount    = unreadApiCount + unreadSmartAlerts.length;

  const { mutate: doMarkRead } = useMutation({
    mutationFn: markRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: doMarkAll } = useMutation({
    mutationFn: markAllRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    if (token) { try { await authLogout(token); } catch { /* ignore */ } }
    logout();
    navigate('/login');
  };

  const fullName = user?.full_name ?? user?.email ?? 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:px-6">
      {/* Search */}
      <div className="hidden flex-1 sm:flex">
        <button
          type="button"
          onClick={onSearchClick}
          className="relative flex h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border/60 bg-card/80 ps-9 pe-12 text-sm text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-card hover:shadow-shadow-1 focus-within:border-primary/40 focus-within:shadow-shadow-2"
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <span className="truncate text-[13px]">{t('nav.search.placeholder')}</span>
          <kbd className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        {/* Language toggle */}
        <button
          type="button"
          onClick={toggleLang}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all duration-150 hover:bg-accent hover:border-primary/30 hover:shadow-shadow-1"
          title={t('nav.toggleLanguage')}
        >
          <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
          <span>{lang === 'en' ? 'EN' : 'عر'}</span>
        </button>

        <InstallPWAButton compact />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title={t('nav.toggleTheme')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-shadow-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="card-glass absolute end-0 top-11 z-50 w-80 overflow-hidden animate-slide-up-sm">
              <div className="flex items-center justify-between border-b border-border/40 bg-background/40 backdrop-blur px-4 py-3">
                <p className="text-[13px] font-semibold">{t('nav.notifications')}</p>
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] font-semibold text-primary hover:underline"
                    onClick={() => doMarkAll()}
                  >
                    {t('nav.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unreadSmartAlerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="cursor-pointer border-b border-border/40 bg-accent/20 px-4 py-3 transition-colors hover:bg-accent/40"
                    onClick={() => markAlertRead(a.id)}
                  >
                    <div className="flex items-start gap-2">
                      {a.severity === 'critical' ? <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" /> :
                       a.severity === 'warning'  ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> :
                       <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{a.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && unreadSmartAlerts.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-muted-foreground">
                    {t('nav.noNotifications')}
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'cursor-pointer border-b border-border/40 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40',
                        !n.is_read && 'bg-accent/20',
                      )}
                      onClick={() => { if (!n.is_read) doMarkRead(n.id); }}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', alertColors[n.type] ?? 'bg-muted-foreground')} />
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-[13px] font-medium', !n.is_read ? 'text-foreground' : 'text-muted-foreground')}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.description}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-1" ref={userRef}>
          <button
            onClick={() => setUserOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors duration-150 hover:bg-accent/60"
          >
            <Initials name={fullName} />
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold leading-tight text-foreground">
                {fullName.split(' ')[0]}
              </p>
              {user?.role && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {user.role}
                </p>
              )}
            </div>
            <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
          </button>

          {userOpen && (
            <div className="card-glass absolute end-0 top-12 z-50 w-56 overflow-hidden animate-slide-up-sm">
              <div className="border-b border-border/40 px-4 py-3">
                <p className="truncate text-[13px] font-semibold">{fullName}</p>
                {user?.email && (
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                )}
              </div>
              <button
                onClick={() => { setUserOpen(false); navigate('/profile'); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-accent/50"
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                {t('nav.profile')}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-border/40 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {t('nav.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
