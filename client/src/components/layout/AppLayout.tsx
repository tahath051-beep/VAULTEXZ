import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { SheetTabsBar } from '@/components/shared/SheetTabsBar';
import { QuickActionFAB } from '@/components/shared/QuickActionFAB';
import { UniversalSearchPalette } from '@/components/shared/UniversalSearchPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { WifiOff, X } from 'lucide-react';

/* ── Offline banner ───────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setOffline(true); setDismissed(false); };
    const handleOnline  = () => {
      setOffline(false);
      setDismissed(false);
      // stamp last-sync time for the offline.html page
      try { localStorage.setItem('vaultex-last-sync', new Date().toISOString()); } catch {}
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="relative z-50 flex items-center gap-3 bg-amber-500/95 px-4 py-2.5 text-sm font-medium text-amber-950 backdrop-blur-sm">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        You&apos;re offline — showing cached data. Some actions are unavailable.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 hover:bg-amber-600/30 transition-colors"
        aria-label="Dismiss offline notice"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Main layout ──────────────────────────────────────────── */
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
        <OfflineBanner />
        {/* pb-16 on mobile so content clears the bottom nav */}
        <main className="flex-1 overflow-y-auto gradient-bg-soft px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 pb-20 md:pb-10">
          <div className="mx-auto w-full max-w-[1400px]">
            <div key={location.pathname} className="animate-slide-up">
              <Outlet />
            </div>
          </div>
        </main>
        <SheetTabsBar />
      </div>

      {/* Mobile bottom nav — hidden on md+ */}
      <BottomNav />

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
