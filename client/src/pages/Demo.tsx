import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { clientLogin } from '@/api/clientPortal.api';
import { ibLogin } from '@/api/ib.api';
import { toast } from '@/hooks/use-toast';
import { User, Network, ChevronRight, Sun, Moon, Mail, Lock } from 'lucide-react';

export default function DemoPage() {
  const navigate = useNavigate();
  const { setAuth: setClientAuth, clientUser } = useClientAuthStore();
  const { setAuth: setIBAuth, ibUser } = useIBAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const [clientLoading, setClientLoading] = useState(false);
  const [ibLoading, setIBLoading] = useState(false);

  const handleClientEnter = async () => {
    if (clientUser) { navigate('/client/dashboard'); return; }
    setClientLoading(true);
    try {
      const result = await clientLogin('client@demo.com', 'Demo@123456');
      setClientAuth(result.token, result.user);
      navigate('/client/dashboard');
    } catch {
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally {
      setClientLoading(false);
    }
  };

  const handleIBEnter = async () => {
    if (ibUser) { navigate('/ib/dashboard'); return; }
    setIBLoading(true);
    try {
      const result = await ibLogin('ib@demo.com', 'Demo@123456');
      setIBAuth(result.token, result.user);
      navigate('/ib/dashboard');
    } catch {
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally {
      setIBLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FX</span>
          </div>
          <span className="font-bold text-foreground">FX Accounting</span>
        </div>
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border border-yellow-400/30 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            DEMO MODE — Mock Data Only
          </div>
          <h1 className="text-3xl font-bold text-foreground">Select Portal Access</h1>
          <p className="text-muted-foreground mt-2">Choose a portal to explore with pre-loaded demo data</p>
        </div>

        {/* Portal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Client Portal */}
          <Card className="overflow-hidden border-border hover:border-blue-500/50 transition-colors group">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-bold text-lg text-foreground">Client Portal</p>
              <p className="text-sm text-muted-foreground mb-1">Trading account access</p>
              <p className="text-sm text-muted-foreground mb-5">
                View your trades, balances and transactions
              </p>

              {/* Credentials */}
              <div className="rounded-lg bg-muted/60 border border-border p-3 mb-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono">client@demo.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono">Demo@123456</span>
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleClientEnter}
                  disabled={clientLoading}
                >
                  {clientLoading ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  {clientUser ? 'Continue as Client' : 'Enter as Client'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* IB Portal */}
          <Card className="overflow-hidden border-border hover:border-amber-500/50 transition-colors group">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Network className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-bold text-lg text-foreground">IB Portal</p>
              <p className="text-sm text-muted-foreground mb-1">Introducing broker access</p>
              <p className="text-sm text-muted-foreground mb-5">
                View commissions, clients and referrals
              </p>

              {/* Credentials */}
              <div className="rounded-lg bg-muted/60 border border-border p-3 mb-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono">ib@demo.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono">Demo@123456</span>
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleIBEnter}
                  disabled={ibLoading}
                >
                  {ibLoading ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  {ibUser ? 'Continue as IB' : 'Enter as IB'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin link */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="h-px w-48 bg-border" />
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            Admin Panel
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
