import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, ShieldCheck, LineChart, ArrowLeft, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { authLogin } from '@/api/auth.api';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PortalEntryScreen } from '@/components/shared/PortalEntryScreen';
import { useTranslation } from '@/lib/i18n/useTranslation';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const { t, lang, toggleLang } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await authLogin(data);
      setAuth(result.token, result.user);
      setShowEntry(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed — check credentials';
      toast({ title: 'Login failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: LineChart,   text: t('login.feature1') },
    { icon: ShieldCheck, text: t('login.feature2') },
    { icon: TrendingUp,  text: t('login.feature3') },
  ];

  return (
    <>
    {showEntry && (
      <PortalEntryScreen portal="admin" onComplete={() => navigate('/')} />
    )}
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, hsl(222 91% 65%) 0%, hsl(222 84% 56%) 35%, hsl(262 84% 48%) 100%)',
          }}
        />
        {/* Floating orbs */}
        <div aria-hidden className="absolute -left-12 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float" />
        <div aria-hidden className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div aria-hidden className="absolute inset-0 opacity-20 dot-grid" />

        <div className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <span className="text-sm font-bold text-white">FX</span>
          </div>
          <p className="text-base font-semibold tracking-tight">{t('app.name')}</p>
        </div>

        <div className="relative max-w-lg">
          <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3 w-3" /> AI-Powered Workbook
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight whitespace-pre-line">
            {t('login.headline')}
          </h1>
          <p className="mt-3 text-base opacity-80">
            {t('login.subline')}
          </p>

          <ul className="mt-8 space-y-2.5 text-sm">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <f.icon className="h-3.5 w-3.5" />
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-70">© {new Date().getFullYear()} {t('app.name')} — Workbook PWA</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none lg:hidden" />

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="absolute top-6 end-6 inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:border-primary/30 hover:shadow-shadow-1"
        >
          <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
          <span>{lang === 'en' ? 'EN' : 'عر'}</span>
        </button>

        <div className="relative w-full max-w-sm">
          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Demo access
          </Link>

          <div className="mt-6 lg:hidden">
            <div className="inline-flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg glow-primary">
                <span className="text-sm font-bold text-white">FX</span>
              </div>
              <p className="text-sm font-semibold tracking-tight">{t('app.name')}</p>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to open the workbook.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">{t('field.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@demo.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">{t('field.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner className="h-4 w-4" /> : t('common.signIn')}
            </Button>

            <p className="rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
              Demo · <span className="font-mono">admin@demo.com</span> / <span className="font-mono">Demo@123456</span>
            </p>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
