import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SheetTabsBar } from '@/components/shared/SheetTabsBar';
import { QuickActionFAB } from '@/components/shared/QuickActionFAB';
import { UniversalSearchPalette } from '@/components/shared/UniversalSearchPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function AppLayoutInner() {
  const [searchOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const location = useLocation();

  useKeyboardShortcuts([
    { key: 'k', ctrl: true, action: () => setSearchActive(true), description: 'Open search' },
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onSearchClick={() => setSearchActive(true)} />
        <main className="flex-1 overflow-y-auto gradient-bg-soft px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1400px]">
            <div key={location.pathname} className="animate-slide-up">
              <Outlet />
            </div>
          </div>
        </main>
        <SheetTabsBar />
      </div>

      <QuickActionFAB />
      <UniversalSearchPalette open={searchOpen || searchActive} onClose={() => setSearchActive(false)} />
    </div>
  );
}

export function AppLayout() {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/demo" replace />;
  return <AppLayoutInner />;
}
