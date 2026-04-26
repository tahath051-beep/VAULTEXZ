import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, LogOut, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { authLogout } from '@/api/auth.api';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string; type: string; title: string; description: string; is_read: boolean; created_at: string;
}

const alertColors: Record<string, string> = {
  RECON_BREAK:          'bg-red-500',
  NEGATIVE_BALANCE:     'bg-red-500',
  JOURNAL_FAILED:       'bg-red-500',
  LARGE_WITHDRAWAL:     'bg-orange-500',
  LP_STATEMENT_MISSING: 'bg-orange-500',
  IB_PAYOUT_DUE:        'bg-yellow-500',
};

const getNotifications = () =>
  api.get<{ success: boolean; data: { notifications: Notification[] } }>('/notifications')
    .then((r) => r.data.data.notifications);

const markRead = (id: string) => api.patch(`/notifications/${id}/read`);
const markAllRead = () => api.patch('/notifications/read-all');

function timeAgo(dateStr: string) {
  const diffMs  = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function Navbar() {
  const { theme, toggleTheme }    = useUIStore();
  const { user, token, logout }   = useAuthStore();
  const navigate                  = useNavigate();
  const qc                        = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef                  = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const { mutate: doMarkRead } = useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: doMarkAll } = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const handleLogout = async () => {
    if (token) {
      try { await authLogout(token); } catch { /* ignore */ }
    }
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.full_name ?? user?.email}</span>
          {user?.role && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {user.role}
            </span>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-popover shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <button className="text-xs text-primary hover:underline" onClick={() => doMarkAll()}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                        !n.is_read && 'bg-muted/30'
                      )}
                      onClick={() => { if (!n.is_read) doMarkRead(n.id); }}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', alertColors[n.type] ?? 'bg-muted-foreground')} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', !n.is_read ? 'text-foreground' : 'text-muted-foreground')}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
