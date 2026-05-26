import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, Sun, Moon, Sparkles,
  BarChart3, ShieldCheck, Zap, Globe2, Users, TrendingUp,
  Scale, Lock as LockIcon, Bell, ArrowRight, CheckCircle2,
  LayoutGrid, Network, User,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PortalEntryScreen } from '@/components/shared/PortalEntryScreen';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { clientLogin } from '@/api/clientPortal.api';
import { ibLogin } from '@/api/ib.api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ── Scroll-reveal hook ────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

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
  icon: Icon, title, description, gradient, delay = 0,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6',
        'transition-all duration-500 hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)] hover:-translate-y-1',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl', gradient)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
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
  buttonLabel,
  buttonClass,
  onEnter,
  loading,
  href,
  delay = 0,
}: {
  icon: typeof User;
  iconBg: string;
  accentColor: string;
  title: string;
  tagline: string;
  description: string;
  buttonLabel: string;
  buttonClass: string;
  onEnter?: () => void;
  loading?: boolean;
  href?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView(0.08);
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-3xl border bg-card',
        'transition-all duration-500 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1',
        accentColor,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
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

/* ── Floating pill badge ───────────────────────────────────── */
function FloatingPill({
  label, style,
}: { label: string; style: React.CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute select-none rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/20 backdrop-blur-sm"
      style={style}
    >
      {label}
    </div>
  );
}

/* ── Stat item (uses its own inView hook) ──────────────────── */
function StatItem({ value, suffix, label, delay }: {
  value: number; suffix: string; label: string; delay: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        'text-center transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-3xl font-extrabold tabular-nums text-foreground">
        <Counter to={value} suffix={suffix} />
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ── Portal feature card (uses its own inView hook) ────────── */
function PortalFeatureItem({ portal, delay }: {
  portal: { icon: typeof LayoutGrid; color: string; bg: string; title: string; points: string[] };
  delay: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-6 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl', portal.bg)}>
        <portal.icon className={cn('h-6 w-6', portal.color)} />
      </div>
      <h3 className="mb-3 text-[15px] font-bold text-foreground">{portal.title}</h3>
      <ul className="space-y-2">
        {portal.points.map((pt) => (
          <li key={pt} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {pt}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Admin panel mockup ────────────────────────────────────── */
function AppMockup() {
  const { ref, visible } = useInView(0.08);

  /* category cards mimicking the real admin panel */
  const cats = [
    { label: 'Funds',    amount: '$284k', accent: 'bg-orange-400', dot: 'bg-orange-400',  bar: 72 },
    { label: 'Banks',    amount: '$1.2M', accent: 'bg-sky-400',    dot: 'bg-sky-400',     bar: 88 },
    { label: 'Clients',  amount: '$847k', accent: 'bg-pink-400',   dot: 'bg-pink-400',    bar: 61 },
    { label: 'Revenue',  amount: '$125k', accent: 'bg-violet-400', dot: 'bg-violet-400',  bar: 45 },
    { label: 'Expenses', amount: '$42k',  accent: 'bg-red-400',    dot: 'bg-red-400',     bar: 29 },
    { label: 'IB Comm',  amount: '$18k',  accent: 'bg-amber-400',  dot: 'bg-amber-400',   bar: 53 },
  ];

  /* sidebar nav items */
  const navItems = [
    { color: 'bg-blue-500/40',   active: true  },
    { color: 'bg-white/8',       active: false },
    { color: 'bg-white/8',       active: false },
    { color: 'bg-white/8',       active: false },
    { color: 'bg-white/8',       active: false },
    { color: 'bg-white/8',       active: false },
    { color: 'bg-white/8',       active: false },
  ];

  /* chart bars mimicking equity trend */
  const bars = [38, 52, 44, 67, 55, 78, 62, 85, 70, 91, 76, 94];

  return (
    <div
      ref={ref}
      className={cn(
        'relative mx-auto mt-16 max-w-4xl transition-all duration-700',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-14',
      )}
    >
      {/* ── Floating badges around the mockup ──────────────────── */}

      {/* 1. Reconciled ✓ — top right, emerald */}
      <div
        className="absolute -right-2 top-10 z-20 hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 shadow-[0_8px_24px_rgba(16,185,129,0.45)] text-white text-[11px] font-bold"
        style={{ animation: 'float-slow 6s ease-in-out infinite' }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Reconciled ✓
      </div>

      {/* 2. EUR/USD live rate — top right, below reconciled */}
      <div
        className="absolute -right-6 top-[88px] z-20 hidden sm:flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-[10px]"
        style={{ animation: 'float-slow 9s ease-in-out infinite', animationDelay: '-2s' }}
      >
        <span className="font-mono font-bold text-foreground text-[11px]">EUR/USD</span>
        <span className="font-mono text-emerald-500 font-semibold">1.0847</span>
        <span className="text-emerald-400 text-[9px]">▲ 0.12%</span>
      </div>

      {/* 3. Trade closed profit — top left corner, green */}
      <div
        className="absolute -left-6 -top-4 z-20 hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 shadow-[0_8px_24px_rgba(16,185,129,0.35)] text-white text-[11px] font-bold"
        style={{ animation: 'float-slow 7s ease-in-out infinite', animationDelay: '-4s' }}
      >
        <TrendingUp className="h-3.5 w-3.5" />
        Trade closed · +$842
      </div>

      {/* 4. New withdrawal request — left mid */}
      <div
        className="absolute -left-4 top-28 z-20 hidden sm:block rounded-xl border border-border/60 bg-card px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] text-[10px]"
        style={{ animation: 'float-slow 8s ease-in-out infinite', animationDelay: '-3s' }}
      >
        <p className="font-semibold text-foreground text-[11px]">New withdrawal request</p>
        <p className="text-muted-foreground mt-0.5">$12,500 · pending review</p>
        <div className="mt-1.5 flex items-center gap-1">
          <div className="h-1 flex-1 rounded-full bg-amber-400/30">
            <div className="h-1 w-3/4 rounded-full bg-amber-400" />
          </div>
          <span className="text-amber-500 font-medium">Pending</span>
        </div>
      </div>

      {/* 5. IB Commission chip — right mid */}
      <div
        className="absolute -right-4 top-[44%] z-20 hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 shadow-[0_8px_20px_rgba(245,158,11,0.2)] text-[11px]"
        style={{ animation: 'float-slow 11s ease-in-out infinite', animationDelay: '-6s' }}
      >
        <Network className="h-3 w-3 text-amber-500" />
        <span className="font-semibold text-amber-600 dark:text-amber-400">IB Comm · $1,240</span>
      </div>

      {/* 6. 3 approvals badge — right bottom */}
      <div
        className="absolute -right-3 bottom-14 z-20 hidden sm:flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 shadow-[0_8px_24px_rgba(37,99,235,0.4)] text-white text-[11px] font-bold"
        style={{ animation: 'float-slow 9s ease-in-out infinite', animationDelay: '-1.5s' }}
      >
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-extrabold">3</div>
        Approvals waiting
      </div>

      {/* 7. AI insight chip — bottom left */}
      <div
        className="absolute -bottom-3 left-8 z-20 hidden sm:flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary shadow-[0_4px_16px_hsl(var(--primary)/0.2)]"
        style={{ animation: 'float-slow 10s ease-in-out infinite', animationDelay: '-5s' }}
      >
        <Sparkles className="h-3 w-3" />
        AI: All books balanced
      </div>

      {/* 8. EOD complete chip — bottom right */}
      <div
        className="absolute -bottom-5 right-12 z-20 hidden sm:flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[10px] font-semibold text-violet-500 shadow-[0_4px_16px_rgba(139,92,246,0.2)]"
        style={{ animation: 'float-slow 13s ease-in-out infinite', animationDelay: '-7s' }}
      >
        <ShieldCheck className="h-3 w-3" />
        EOD Complete · Day locked
      </div>

      {/* 9. Mini sparkline chip — left bottom */}
      <div
        className="absolute -left-2 bottom-10 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.1)] text-[10px]"
        style={{ animation: 'float-slow 12s ease-in-out infinite', animationDelay: '-9s' }}
      >
        <div className="flex items-end gap-0.5 h-5">
          {[40, 55, 48, 70, 62, 85, 78].map((h, i) => (
            <div key={i} className="w-1 rounded-sm bg-gradient-to-t from-blue-500 to-violet-400" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div>
          <p className="font-semibold text-foreground">Equity</p>
          <p className="text-emerald-500 font-bold">+14.2%</p>
        </div>
      </div>

      {/* 10. Live ping dot — overlaid on mockup */}
      <div
        className="absolute right-[28%] top-[60px] z-20 hidden sm:block"
        style={{ animation: 'float-slow 7s ease-in-out infinite', animationDelay: '-1s' }}
      >
        <div className="relative flex h-4 w-4 items-center justify-center">
          <div className="absolute h-4 w-4 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* ── Browser shell ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_32px_96px_-16px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.04)]">

        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
          </div>
          <div className="mx-auto flex w-52 items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1 border border-border/40">
            <div className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span className="text-[10px] text-muted-foreground">app.vaultex.com / dashboard</span>
          </div>
          {/* right side nav icons */}
          <div className="flex items-center gap-1.5 ms-auto">
            <div className="h-5 w-5 rounded-md bg-muted/60" />
            <div className="h-5 w-5 rounded-md bg-muted/60" />
          </div>
        </div>

        {/* ── App layout ──────────────────────────────────────────── */}
        <div className="grid grid-cols-[52px_1fr]">

          {/* Sidebar — always dark, matches real app */}
          <div className="flex flex-col items-center gap-2 border-e border-white/5 bg-[hsl(222_47%_9%)] px-2 py-3">
            {/* Logo */}
            <div className="mb-1 h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
              <span className="text-[8px] font-extrabold text-white">VX</span>
            </div>
            {/* Nav items */}
            {navItems.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'h-7 w-full rounded-lg transition-colors',
                  item.active ? 'bg-blue-500/25 ring-1 ring-blue-500/30' : 'bg-white/4',
                )}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="bg-[hsl(var(--background))] p-3 space-y-2.5">

            {/* Top bar */}
            <div className="flex items-center gap-2">
              {/* Breadcrumb / title */}
              <div className="h-2.5 w-20 rounded-full bg-foreground/20" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2 w-14 rounded-full bg-muted-foreground/20" />
              <div className="ms-auto flex items-center gap-1.5">
                {/* Search */}
                <div className="h-5 w-24 rounded-lg border border-border/50 bg-muted/40" />
                {/* Bell with dot */}
                <div className="relative h-5 w-5 rounded-lg bg-muted/40">
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-500 ring-1 ring-card" />
                </div>
                {/* Avatar */}
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-violet-600" />
              </div>
            </div>

            {/* Category cards — 6 in a row, mimicking real dashboard */}
            <div className="grid grid-cols-6 gap-1.5">
              {cats.map((c) => (
                <div key={c.label} className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-2">
                  {/* Left accent strip like real app */}
                  <div className={cn('absolute left-0 top-0 h-full w-0.5 rounded-s-xl', c.accent)} />
                  <div className="ms-1">
                    {/* Colored dot + label */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
                      <div className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
                    </div>
                    {/* Amount */}
                    <div className="h-2.5 w-10 rounded-full bg-foreground/15 mb-1.5" />
                    {/* Mini bar */}
                    <div className="h-0.5 w-full rounded-full bg-muted/40">
                      <div className={cn('h-0.5 rounded-full', c.accent)} style={{ width: `${c.bar}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + table row */}
            <div className="grid grid-cols-[1fr_100px] gap-2">

              {/* Equity trend chart — mimics the real TrendChart */}
              <div className="rounded-xl border border-border/50 bg-card p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2 w-20 rounded-full bg-foreground/15" />
                  <div className="h-1.5 w-10 rounded-full bg-muted/50" />
                </div>
                {/* Bars with gradient fill */}
                <div className="flex h-12 items-end gap-0.5 pb-0">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600/70 via-violet-500/50 to-violet-400/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                {/* X axis */}
                <div className="mt-1 flex justify-between">
                  {['Jan', 'Apr', 'Jul', 'Oct'].map((m) => (
                    <div key={m} className="h-1.5 w-4 rounded-full bg-muted/40" />
                  ))}
                </div>
              </div>

              {/* Mini operations table */}
              <div className="rounded-xl border border-border/50 bg-card p-2 space-y-1.5">
                <div className="h-2 w-14 rounded-full bg-foreground/15 mb-2" />
                {[
                  { dot: 'bg-emerald-400', status: 'bg-emerald-400/20 text-emerald-600' },
                  { dot: 'bg-amber-400',   status: 'bg-amber-400/20 text-amber-600'   },
                  { dot: 'bg-emerald-400', status: 'bg-emerald-400/20 text-emerald-600' },
                  { dot: 'bg-blue-400',    status: 'bg-blue-400/20 text-blue-600'     },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', row.dot)} />
                    <div className="h-1.5 flex-1 rounded-full bg-muted/50" />
                    <div className={cn('h-3 w-7 rounded-md', row.status)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom health bar — mimics health score */}
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
              <div className="h-1.5 w-24 rounded-full bg-foreground/15" />
              <div className="ms-auto flex gap-1">
                {[90, 75, 88].map((v, i) => (
                  <div key={i} className="h-3 w-8 overflow-hidden rounded-md bg-muted/40">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-emerald-400 to-teal-400"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
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
  const { t, lang, toggleLang } = useTranslation();

  const [clientLoading, setClientLoading] = useState(false);
  const [ibLoading, setIBLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<'client' | 'ib' | null>(null);

  const handleClientEnter = async () => {
    if (clientUser) { setActiveEntry('client'); return; }
    setClientLoading(true);
    try {
      const r = await clientLogin('client@demo.com', 'Demo@123456');
      setClientAuth(r.token, r.user);
      setActiveEntry('client');
    } catch {
      toast({ title: t('demo.loginFailed'), variant: 'destructive' });
    } finally { setClientLoading(false); }
  };

  const handleIBEnter = async () => {
    if (ibUser) { setActiveEntry('ib'); return; }
    setIBLoading(true);
    try {
      const r = await ibLogin('ib@demo.com', 'Demo@123456');
      setIBAuth(r.token, r.user);
      setActiveEntry('ib');
    } catch {
      toast({ title: t('demo.loginFailed'), variant: 'destructive' });
    } finally { setIBLoading(false); }
  };

  const features = [
    { icon: Scale,      title: t('demo.f1.title'), description: t('demo.f1.desc'), gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' },
    { icon: Zap,        title: t('demo.f2.title'), description: t('demo.f2.desc'), gradient: 'bg-gradient-to-br from-violet-500 to-violet-700' },
    { icon: Globe2,     title: t('demo.f3.title'), description: t('demo.f3.desc'), gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700' },
    { icon: Users,      title: t('demo.f4.title'), description: t('demo.f4.desc'), gradient: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { icon: TrendingUp, title: t('demo.f5.title'), description: t('demo.f5.desc'), gradient: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    { icon: LockIcon,   title: t('demo.f6.title'), description: t('demo.f6.desc'), gradient: 'bg-gradient-to-br from-slate-500 to-slate-700' },
    { icon: Bell,       title: t('demo.f7.title'), description: t('demo.f7.desc'), gradient: 'bg-gradient-to-br from-red-500 to-red-700' },
    { icon: BarChart3,  title: t('demo.f8.title'), description: t('demo.f8.desc'), gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700' },
    { icon: ShieldCheck,title: t('demo.f9.title'), description: t('demo.f9.desc'), gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
  ];

  const stats = [
    { value: 99,  suffix: '.9%',      label: t('demo.stats.accuracy')  },
    { value: 3,   suffix: ' portals', label: t('demo.stats.portals')   },
    { value: 20,  suffix: '+ pages',  label: t('demo.stats.pages')     },
    { value: 100, suffix: '%',        label: t('demo.stats.bilingual') },
  ];

  const checks = [
    t('demo.check.noSetup'),
    t('demo.check.preloaded'),
    t('demo.check.arabic'),
    t('demo.check.pwa'),
  ];

  const portals = [
    {
      icon: LayoutGrid,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: t('demo.admin.title'),
      points: [t('demo.admin.p1'), t('demo.admin.p2'), t('demo.admin.p3'), t('demo.admin.p4')],
    },
    {
      icon: User,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      title: t('demo.clientSection.title'),
      points: [t('demo.clientSection.p1'), t('demo.clientSection.p2'), t('demo.clientSection.p3'), t('demo.clientSection.p4')],
    },
    {
      icon: Network,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      title: t('demo.ibSection.title'),
      points: [t('demo.ibSection.p1'), t('demo.ibSection.p2'), t('demo.ibSection.p3'), t('demo.ibSection.p4')],
    },
  ];

  /* floating pill labels */
  const floatingPills = [
    { label: '⚡ Real-time',   style: { top: '12%',  left: '8%',   animationDuration: '9s',  animationDelay: '0s'   } },
    { label: '🔒 Secure',      style: { top: '18%',  right: '10%', animationDuration: '11s', animationDelay: '-3s'  } },
    { label: '🌐 Bilingual',   style: { top: '62%',  left: '6%',   animationDuration: '13s', animationDelay: '-1.5s'} },
    { label: '📊 Analytics',   style: { top: '55%',  right: '7%',  animationDuration: '10s', animationDelay: '-4s'  } },
    { label: '💱 Multi-FX',    style: { top: '80%',  left: '18%',  animationDuration: '14s', animationDelay: '-2s'  } },
    { label: '🤖 Automated',   style: { top: '78%',  right: '15%', animationDuration: '8s',  animationDelay: '-5s'  } },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Portal entry overlay */}
      {activeEntry && (
        <PortalEntryScreen
          portal={activeEntry}
          onComplete={() => navigate(activeEntry === 'client' ? '/client/dashboard' : '/ib/dashboard')}
        />
      )}

      {/* ── Sticky navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-[0_0_16px_hsl(217_91%_60%/0.4)]">
              <span className="text-[13px] font-bold tracking-tight text-white">VX</span>
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight text-foreground">{t('app.name')}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{t('demo.byVaultex')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-muted hover:border-primary/30"
            >
              <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
              <span>{lang === 'en' ? 'EN' : 'عر'}</span>
            </button>
            {/* Theme toggle */}
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
      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28">

        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Primary orb — top center, drifts */}
          <div
            className="absolute -top-32 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-600/25 to-violet-600/15 blur-3xl"
            style={{ animation: 'drift 18s ease-in-out infinite' }}
          />
          {/* Top-right orb — floats opposite phase */}
          <div
            className="absolute -right-24 -top-16 h-96 w-96 rounded-full bg-gradient-to-bl from-violet-500/20 to-transparent blur-3xl"
            style={{ animation: 'float-slow 12s ease-in-out infinite', animationDelay: '-4s' }}
          />
          {/* Bottom-left orb — slow pulse */}
          <div
            className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
            style={{ animation: 'float-slow 10s ease-in-out infinite', animationDelay: '-2s' }}
          />
          {/* Bottom-right pink depth orb */}
          <div
            className="absolute -bottom-8 right-0 h-64 w-64 rounded-full bg-gradient-to-tl from-pink-500/10 to-transparent blur-3xl"
            style={{ animation: 'float-slow 14s ease-in-out infinite', animationDelay: '-6s' }}
          />
          {/* Center-left cyan depth orb */}
          <div
            className="absolute left-0 top-1/2 h-48 w-48 rounded-full bg-gradient-to-r from-cyan-500/8 to-transparent blur-3xl"
            style={{ animation: 'float-slow 16s ease-in-out infinite', animationDelay: '-8s' }}
          />

          {/* Dot grid — subtle tech texture */}
          <div className="absolute inset-0 dot-grid opacity-[0.03]" />
        </div>

        {/* Floating feature pills in hero background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingPills.map((p) => (
            <FloatingPill
              key={p.label}
              label={p.label}
              style={{ ...p.style, animation: `float-x ${p.style.animationDuration} ease-in-out infinite` }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold text-primary animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            {t('demo.badge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-slide-up">
            {t('demo.hero.headline1')}{' '}
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              {t('demo.hero.headline2')}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {t('demo.hero.sub')}
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <a
              href="#portals"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_24px_hsl(217_91%_60%/0.4)] transition-all hover:shadow-[0_4px_32px_hsl(217_91%_60%/0.6)] hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              {t('demo.cta.explore')}
            </a>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-border px-7 py-3.5 text-[14px] font-semibold text-foreground transition-all hover:bg-muted"
            >
              <LayoutGrid className="h-4 w-4" />
              {t('demo.cta.admin')}
            </Link>
          </div>

          {/* Check list */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {checks.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Mini app mockup */}
        <AppMockup />
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/30 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s, i) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('demo.features.heading')}</h2>
            <p className="mt-3 text-muted-foreground">{t('demo.features.sub')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('demo.portals.heading')}</h2>
            <p className="mt-3 text-muted-foreground">{t('demo.portals.sub')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {portals.map((p, i) => (
              <PortalFeatureItem key={p.title} portal={p} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal access ──────────────────────────────────────── */}
      <section id="portals" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('demo.choose.heading')}</h2>
            <p className="mt-3 text-muted-foreground">{t('demo.choose.sub')}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Admin */}
            <PortalCard
              icon={LayoutGrid}
              iconBg="bg-gradient-to-br from-blue-600 to-violet-600"
              accentColor="border-blue-500/20 hover:border-blue-500/50"
              title={t('demo.adminCard.title')}
              tagline={t('demo.adminCard.tagline')}
              description={t('demo.adminCard.desc')}
              buttonLabel={t('demo.adminCard.btn')}
              buttonClass="bg-gradient-to-r from-blue-600 to-violet-600 shadow-[0_4px_16px_hsl(217_91%_60%/0.35)]"
              href="/login"
              delay={0}
            />

            {/* Client */}
            <PortalCard
              icon={User}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
              accentColor="border-emerald-500/20 hover:border-emerald-500/50"
              title={t('demo.clientCard.title')}
              tagline={t('demo.clientCard.tagline')}
              description={t('demo.clientCard.desc')}
              buttonLabel={clientUser ? t('demo.clientCard.btnContinue') : t('demo.clientCard.btn')}
              buttonClass="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_16px_rgb(16_185_129/0.35)]"
              onEnter={handleClientEnter}
              loading={clientLoading}
              delay={120}
            />

            {/* IB */}
            <PortalCard
              icon={Network}
              iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
              accentColor="border-amber-500/20 hover:border-amber-500/50"
              title={t('demo.ibCard.title')}
              tagline={t('demo.ibCard.tagline')}
              description={t('demo.ibCard.desc')}
              buttonLabel={ibUser ? t('demo.ibCard.btnContinue') : t('demo.ibCard.btn')}
              buttonClass="bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_4px_16px_rgb(245_158_11/0.35)]"
              onEnter={handleIBEnter}
              loading={ibLoading}
              delay={240}
            />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        {/* bg gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/8 via-violet-600/6 to-transparent" />
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.035]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t('demo.cta.readyBadge')}
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t('demo.cta.readyHeadline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t('demo.cta.readySub')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#portals"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_24px_hsl(217_91%_60%/0.4)] transition-all hover:shadow-[0_4px_32px_hsl(217_91%_60%/0.6)] hover:-translate-y-0.5"
            >
              <ArrowRight className="h-4 w-4" />
              {t('demo.cta.explore')}
            </a>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-8 py-3.5 text-[14px] font-semibold text-foreground transition-all hover:bg-muted hover:border-primary/30"
            >
              <LayoutGrid className="h-4 w-4" />
              {t('demo.cta.admin')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <span className="text-[10px] font-bold text-white">VX</span>
          </div>
          <span className="text-[13px] font-semibold text-foreground">{t('app.name')}</span>
          <span className="text-muted-foreground/40 mx-1">·</span>
          <span className="text-[12px] text-muted-foreground">{t('demo.byVaultex')}</span>
        </div>
      </footer>
    </div>
  );
}
