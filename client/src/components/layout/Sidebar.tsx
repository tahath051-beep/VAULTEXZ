import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, BookOpen, BarChart3,
  GitBranch, UserCog, Clock, TrendingUp, Settings, BookMarked, ChevronLeft, UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/',               label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/clients',        label: 'Clients',          icon: Users },
  { to: '/payments',       label: 'Payments',         icon: CreditCard },
  { to: '/journals',       label: 'Journals',         icon: BookOpen },
  { to: '/trades',         label: 'Trades',           icon: TrendingUp },
  { to: '/reports',        label: 'Reports',          icon: BarChart3 },
  { to: '/ib-commissions', label: 'IB Commissions',   icon: GitBranch },
  { to: '/eod',            label: 'EOD Processing',   icon: Clock },
  { to: '/chart-of-accounts', label: 'Chart of Accounts', icon: BookMarked },
  { to: '/users',          label: 'Users',            icon: UserCog },
  { to: '/settings',       label: 'Settings',         icon: Settings },
  { to: '/profile',        label: 'My Profile',       icon: UserCircle },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {sidebarOpen && (
          <span className="font-bold text-lg text-sidebar-primary truncate">FX Accounting</span>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
