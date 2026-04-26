import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, ChevronDown, BarChart3, DollarSign, Users, User, Bell, Sun, Moon } from 'lucide-react';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { getIBNotifications, markIBNotificationRead } from '@/api/ib.api';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/ib/dashboard',   label: 'Dashboard',   icon: BarChart3   },
  { to: '/ib/commissions', label: 'Commissions', icon: DollarSign  },
  { to: '/ib/clients',     label: 'Clients',     icon: Users       },
  { to: '/ib/profile',     label: 'Profile',     icon: User        },
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Initials({ name }: { name: string }) {
  const p = name.trim().split(' ');
  const ini = p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2);
  return (
    <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
      {ini.toUpperCase()}
    </div>
  );
}

export function IBLayout() {
  const { token, ibUser, logout } = useIBAuthStore();
  const { theme, toggleTheme }   = useUIStore();
  const navigate                 = useNavigate();
  const qc                       = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left: Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">FX</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-foreground text-sm leading-tight">FX Accounting</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-tight">IB Portal</p>
              </div>
            </div>

            {/* Center: Nav */}
            <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 justify-center">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-1 w-80 bg-popover rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-semibold text-popover-foreground">Notifications</p>
                      {unread > 0 && <span className="text-xs text-muted-foreground">{unread} unread</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                      ) : notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.is_read) doRead(n.id); }}
                          className={cn(
                            'w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-accent transition-colors',
                            !n.is_read && 'bg-amber-500/5'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />}
                            {n.is_read  && <span className="h-2 w-2 mt-1.5 shrink-0" />}
                            <div>
                              <p className="text-xs font-semibold text-popover-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
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
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <Initials name={ibUser?.full_name ?? 'IB'} />
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[6rem] truncate">
                    {ibUser?.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-popover-foreground">{ibUser?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{ibUser?.ib_code} · {ibUser?.level_label}</p>
                    </div>
                    <button
                      onClick={() => { logout(); navigate('/ib/login', { replace: true }); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
