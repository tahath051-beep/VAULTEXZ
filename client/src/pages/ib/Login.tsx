import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { ibLogin } from '@/api/ib.api';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/useTranslation';

type LoginForm = { email: string; password: string };

export default function IBLogin() {
  const { token, setAuth } = useIBAuthStore();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useTranslation();

  useEffect(() => {
    if (token) navigate('/ib/dashboard', { replace: true });
  }, [token, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const { mutate: login, isPending } = useMutation({
    mutationFn: ({ email, password }: LoginForm) => ibLogin(email, password),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate('/ib/dashboard', { replace: true });
    },
    onError: () => toast({ title: 'Invalid email or password', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-background gradient-bg-soft flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-5 end-5 inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:border-amber-500/30 hover:shadow-shadow-1"
      >
        <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
        <span>{lang === 'en' ? 'EN' : 'عر'}</span>
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-500 mb-4 shadow-shadow-3">
            <span className="text-white font-bold text-xl">IB</span>
          </div>
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="text-amber-600 dark:text-amber-400 font-semibold mt-1">{t('ib.portal')}</p>
        </div>

        <div className="card-elevated rounded-2xl px-8 py-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your IB account</p>

          <form onSubmit={handleSubmit((d) => login(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('field.email')}</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register('email', { required: true })}
                className={errors.email ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('field.password')}</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: true })}
                className={errors.password ? 'border-destructive' : ''}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-shadow-2 hover:shadow-shadow-3 hover:-translate-y-px transition-all active:scale-[0.97]"
              disabled={isPending}
            >
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              {t('common.signIn')}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
            <p className="text-xs font-mono">ib@demo.com / Demo@123456</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin?{' '}
          <a href="/login" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Go to Admin Panel</a>
        </p>
      </div>
    </div>
  );
}
