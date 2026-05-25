import { NavLink } from 'react-router-dom';
import { LayoutGrid, Inbox, Users, BookOpen, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperationsStore } from '@/stores/operations.store';

const tabs = [
  { to: '/',           icon: LayoutGrid, label: 'Dashboard', end: true },
  { to: '/operations', icon: Inbox,      label: 'Operations', badge: true },
  { to: '/clients',    icon: Users,      label: 'Clients' },
  { to: '/reports',    icon: BookOpen,   label: 'Reports' },
  { to: '/profile',    icon: ShieldCheck, label: 'Profile' },
];

export function BottomNav() {
  const pendingCount = useOperationsStore((s) => s.getPendingCount());

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 md:hidden',
        'border-t border-border bg-card/95 backdrop-blur-md',
        'supports-[backdrop-filter]:bg-card/80',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16 px-1">
        {tabs.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1',
                'text-xs font-medium rounded-xl mx-0.5 transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'relative flex items-center justify-center h-8 w-8 rounded-xl transition-colors duration-150',
                    isActive && 'bg-primary/10',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {badge && pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px] leading-none transition-colors', isActive && 'font-semibold')}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
