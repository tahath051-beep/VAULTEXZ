import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, ChevronDown, BarChart3, ArrowLeftRight, FileText, User, TrendingUp, Sun, Moon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { getClientAccounts } from '@/api/clientPortal.api';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/client/dashboard',     label: 'Dashboard',     icon: BarChart3 },
  { to: '/client/trades',        label: 'Trades',        icon: TrendingUp },
  { to: '/client/transactions',  label: 'Transactions',  icon: ArrowLeftRight },
  { to: '/client/statements',    label: 'Statements',    icon: FileText },
  { to: '/client/profile',       label: 'Profile',       icon: User },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const ini = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold select-none">
      {ini.toUpperCase()}
    </div>
  );
}

export function ClientLayout() {
  const { token, clientUser, selectedMt5Id, setSelectedMt5, logout } = useClientAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left: Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">FX</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-foreground text-sm leading-tight">FX Accounting</p>
                <p className="text-xs text-primary font-medium leading-tight">Client Portal</p>
              </div>
            </div>

            {/* Center: Nav tabs */}
            <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 justify-center">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right: Account selector + theme toggle + user menu */}
            <div className="flex items-center gap-2 shrink-0">
              {accounts.length > 1 && (
                <Select
                  value={selectedMt5Id ?? accounts[0]?.id}
                  onValueChange={setSelectedMt5}
                >
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

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <Initials name={clientUser?.full_name ?? 'U'} />
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[6rem] truncate">
                    {clientUser?.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-popover-foreground">{clientUser?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{clientUser?.client_code}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
