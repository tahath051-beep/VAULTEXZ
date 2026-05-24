import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, ChevronDown, BarChart3, ArrowLeftRight, FileText, User, TrendingUp, Sun, Moon } from 'lucide-react';
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
    <div className="h-8 w-8 rounded-xl gradient-bg flex items-center justify-center text-white text-xs font-bold select-none shadow-shadow-1 ring-2 ring-primary/20">
      {ini.toUpperCase()}
    </div>
  );
}

export function ClientLayout() {
  const { token, clientUser, selectedMt5Id, setSelectedMt5, logout } = useClientAuthStore();
  const { theme, toggleTheme }         = useUIStore();
  const { t, lang, toggleLang }        = useTranslation();
  const navigate                       = useNavigate();
  const location                       = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef                        = useRef<HTMLDivElement>(null);

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
    if (accounts.length > 0 && !selectedMt5Id) {
      setSelectedMt5(accounts[0].id);
    }
  }, [accounts, selectedMt5Id, setSelectedMt5]);

  if (!token) return null;

  const handleLogout = () => {
    logout();
    navigate('/client/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background gradient-bg-soft">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-9 w-9 rounded-xl gradient-bg glow-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-[13px] tracking-tight">FX</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-foreground text-[13px] leading-tight">{t('app.name')}</p>
                <p className="text-[11px] text-primary font-semibold leading-tight">{t('client.portal')}</p>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 justify-center">
              {navItems.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{t(labelKey)}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {accounts.length > 1 && (
                <Select value={selectedMt5Id ?? accounts[0]?.id} onValueChange={setSelectedMt5}>
                  <SelectTrigger className="w-36 h-8 text-xs">
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
              )}

              {/* Language toggle */}
              <button
                onClick={toggleLang}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all duration-150 hover:bg-accent hover:border-primary/30 hover:shadow-shadow-1"
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

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-accent/60 transition-colors duration-150"
                >
                  <Initials name={clientUser?.full_name ?? 'U'} />
                  <span className="hidden sm:block text-[13px] font-semibold text-foreground max-w-[6rem] truncate">
                    {clientUser?.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {userMenuOpen && (
                  <div className="card-glass absolute end-0 top-12 z-50 w-52 overflow-hidden animate-slide-up-sm">
                    <div className="px-4 py-3 border-b border-border/40">
                      <p className="text-[13px] font-semibold">{clientUser?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{clientUser?.client_code}</p>
                    </div>
                    <button
                      onClick={handleLogout}
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

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div key={location.pathname} className="animate-slide-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
