import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, Sun, Moon, Mail, Lock, Sparkles,
  BarChart3, ShieldCheck, Zap, Globe2, Users, TrendingUp,
  Scale, Lock as LockIcon, Bell, ArrowRight, CheckCircle2,
  LayoutGrid, Network, User,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { clientLogin } from '@/api/clientPortal.api';
import { ibLogin } from '@/api/ib.api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ── Animated counter ──────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 60;
    const tick = () => {
      frame++;
      setVal(Math.round((frame / total) * to));
      if (frame < total) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => clearTimeout(t);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ── Feature card ──────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, description, gradient,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)] hover:-translate-y-1">
      <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl', gradient)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      {/* glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.06), transparent 70%)' }} />
    </div>
  );
}

/* ── Portal access card ────────────────────────────────────── */
function PortalCard({
  icon: Icon,
  iconBg,
  accentColor,
  title,
  tagline,
  description,
  email,
  password,
  buttonLabel,
  buttonClass,
  onEnter,
  loading,
  href,
}: {
  icon: typeof User;
  iconBg: string;
  accentColor: string;
  title: string;
  tagline: string;
  description: string;
  email?: string;
  password?: string;
  buttonLabel: string;
  buttonClass: string;
  onEnter?: () => void;
  loading?: boolean;
  href?: string;
}) {
  return (
    <div className={cn(
      'relative flex flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300',
      'hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1',
      accentColor,
    )}>
      {/* Top accent strip */}
      <div className={cn('h-1 w-full', iconBg)} />

      <div className="flex flex-col flex-1 p-7">
        {/* Icon */}
        <div className={cn('mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl', iconBg)}>
          <Icon className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-[13px] font-semibold text-primary">{tagline}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>

        {/* Demo credentials */}
        {email && (
          <div className="mt-5 rounded-xl border border-border/60 bg-muted/40 p-3.5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Demo credentials</p>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="font-mono font-medium">{email}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="font-mono font-medium">{password}</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6">
          {href ? (
            <Link
              to={href}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98]',
                buttonClass,
              )}
            >
              <ArrowRight className="h-4 w-4" />
              {buttonLabel}
            </Link>
          ) : (
            <button
              onClick={onEnter}
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60',
                buttonClass,
              )}
            >
              {loading ? <LoadingSpinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
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
      const r = await clientLogin('client@demo.com', 'Demo@123456');
      setClientAuth(r.token, r.user);
      navigate('/client/dashboard');
    } catch {
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally { setClientLoading(false); }
  };

  const handleIBEnter = async () => {
    if (ibUser) { navigate('/ib/dashboard'); return; }
    setIBLoading(true);
    try {
      const r = await ibLogin('ib@demo.com', 'Demo@123456');
      setIBAuth(r.token, r.user);
      navigate('/ib/dashboard');
    } catch {
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally { setIBLoading(false); }
  };

  const features = [
    {
      icon: Scale,
      title: 'Real-time Reconciliation',
      description: 'Instantly compare MT5 equity against your book balances. Gaps surface the moment they appear — no end-of-day surprises.',
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    },
    {
      icon: Zap,
      title: 'Operations Workflow',
      description: 'Deposits, withdrawals and transfers move through a structured approval chain. Every action is logged, timestamped, and auditable.',
      gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
    },
    {
      icon: Globe2,
      title: 'Multi-Currency FX',
      description: 'Track live exchange rates, set alert thresholds, and revalue positions across USD, EUR, AED, TRY and more.',
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    },
    {
      icon: Users,
      title: 'IB Commission Engine',
      description: 'Automatically calculate introducing broker commissions per trade. Drill down to client-level volume and payout history.',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      icon: TrendingUp,
      title: 'Financial Reports',
      description: 'Profit & Loss, Balance Sheet, Trial Balance — generated in seconds. Export to Excel with one click.',
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
    },
    {
      icon: LockIcon,
      title: 'Period Locking & Audit',
      description: 'Lock accounting periods to prevent backdated entries. Every change has a full audit trail by user and timestamp.',
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Automated alerts for negative balances, overdue requests, large transactions, and reconciliation breaks.',
      gradient: 'bg-gradient-to-br from-red-500 to-red-700',
    },
    {
      icon: BarChart3,
      title: 'Operations Analytics',
      description: 'Volume trends, processing times, client activity charts — everything you need to run a data-driven brokerage.',
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Access',
      description: 'Admin, Financial Manager, Operations Staff — each sees only what they need. Sensitive routes are gated by role.',
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    },
  ];

  const stats = [
    { value: 99, suffix: '.9%', label: 'Reconciliation accuracy' },
    { value: 3, suffix: ' portals', label: 'Admin · Client · IB' },
    { value: 20, suffix: '+ pages', label: 'Full accounting suite' },
    { value: 100, suffix: '%', label: 'Arabic / English' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-[0_0_16px_hsl(217_91%_60%/0.4)]">
              <span className="text-[13px] font-bold tracking-tight text-white">FX</span>
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight text-foreground">FX Accounting</p>
              <p className="text-[11px] leading-tight text-muted-foreground">by Vaultex</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-border/60 bg-card px-1 py-1 text-[11px]">
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 font-bold text-amber-600 dark:text-amber-400">LIVE DEMO</span>
              <span className="px-1.5 text-muted-foreground">Mock data</span>
            </div>
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-600/20 to-violet-600/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-gradient-to-bl from-violet-500/15 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Complete FX Brokerage Accounting Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your trading desk,{' '}
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              fully automated
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            Real-time reconciliation, multi-currency operations, IB commission tracking, and client management —
            all in one Arabic/English accounting PWA built for modern FX brokerages.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#portals"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_24px_hsl(217_91%_60%/0.4)] transition-all hover:shadow-[0_4px_32px_hsl(217_91%_60%/0.6)] hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              Explore Live Demo
            </a>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-border px-7 py-3.5 text-[14px] font-semibold text-foreground transition-all hover:bg-muted"
            >
              <LayoutGrid className="h-4 w-4" />
              Admin Panel
            </Link>
          </div>

          {/* Check list */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['No setup required', 'Pre-loaded demo data', 'Full Arabic RTL support', 'PWA — installable'].map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/30 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold tabular-nums text-foreground">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything a brokerage needs</h2>
            <p className="mt-3 text-muted-foreground">
              Built on double-entry accounting principles, designed for speed and compliance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Three portals, one platform</h2>
            <p className="mt-3 text-muted-foreground">Each user type gets a tailored experience with the right level of access.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: LayoutGrid,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                title: 'Admin Panel',
                points: ['Full double-entry accounting', 'Operations & reconciliation', 'EOD processing & reports', 'User & role management'],
              },
              {
                icon: User,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
                title: 'Client Portal',
                points: ['Live account balance', 'Trade history & P&L', 'Transaction statements', 'Deposit & withdrawal requests'],
              },
              {
                icon: Network,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
                title: 'IB Portal',
                points: ['Commission dashboard', 'Referred client list', 'Payout request workflow', 'Sub-IB management'],
              },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl', p.bg)}>
                  <p.icon className={cn('h-6 w-6', p.color)} />
                </div>
                <h3 className="mb-3 text-[15px] font-bold text-foreground">{p.title}</h3>
                <ul className="space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal access ──────────────────────────────────────── */}
      <section id="portals" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              DEMO MODE — Pre-loaded with mock data
            </div>
          </div>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">Choose your portal</h2>
            <p className="mt-3 text-muted-foreground">Click any card to enter instantly with demo credentials.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Admin */}
            <PortalCard
              icon={LayoutGrid}
              iconBg="bg-gradient-to-br from-blue-600 to-violet-600"
              accentColor="border-blue-500/20 hover:border-blue-500/50"
              title="Admin Panel"
              tagline="Full accounting access"
              description="Operations, reconciliation, reports, EOD, client management, and all accounting modules."
              buttonLabel="Enter Admin Panel"
              buttonClass="bg-gradient-to-r from-blue-600 to-violet-600 shadow-[0_4px_16px_hsl(217_91%_60%/0.35)]"
              href="/login"
            />

            {/* Client */}
            <PortalCard
              icon={User}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
              accentColor="border-emerald-500/20 hover:border-emerald-500/50"
              title="Client Portal"
              tagline="Trading account access"
              description="View your balance, trade history, transactions, and submit deposit or withdrawal requests."
              email="client@demo.com"
              password="Demo@123456"
              buttonLabel={clientUser ? 'Continue as Client' : 'Enter as Client'}
              buttonClass="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_16px_rgb(16_185_129/0.35)]"
              onEnter={handleClientEnter}
              loading={clientLoading}
            />

            {/* IB */}
            <PortalCard
              icon={Network}
              iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
              accentColor="border-amber-500/20 hover:border-amber-500/50"
              title="IB Portal"
              tagline="Introducing broker access"
              description="Monitor commissions, view referred clients, manage sub-IBs, and request payouts."
              email="ib@demo.com"
              password="Demo@123456"
              buttonLabel={ibUser ? 'Continue as IB' : 'Enter as IB'}
              buttonClass="bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_4px_16px_rgb(245_158_11/0.35)]"
              onEnter={handleIBEnter}
              loading={ibLoading}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <span className="text-[10px] font-bold text-white">FX</span>
            </div>
            <span className="text-[13px] font-semibold text-foreground">FX Accounting</span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Built with React · TypeScript · Tailwind CSS · Zustand · PWA
          </p>
        </div>
      </footer>
    </div>
  );
}
