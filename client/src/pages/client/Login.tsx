import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { clientLogin } from '@/api/clientPortal.api';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/useTranslation';

type LoginForm = { email: string; password: string };

export default function ClientLogin() {
  const { token, setAuth } = useClientAuthStore();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useTranslation();

  useEffect(() => {
    if (token) navigate('/client/dashboard', { replace: true });
  }, [token, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const { mutate: login, isPending } = useMutation({
    mutationFn: ({ email, password }: LoginForm) => clientLogin(email, password),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate('/client/dashboard', { replace: true });
    },
    onError: () => toast({ title: t('login.failed'), variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-background gradient-bg-soft flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-5 end-5 inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:border-primary/30 hover:shadow-shadow-1"
      >
        <span className="text-sm leading-none">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
        <span>{lang === 'en' ? 'EN' : 'عر'}</span>
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-bg glow-primary mb-4 shadow-shadow-3">
            <span className="text-white font-bold text-xl">FX</span>
          </div>
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="text-primary font-semibold mt-1">{t('client.portal')}</p>
        </div>

        <div className="card-elevated rounded-2xl px-8 py-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">{t('login.welcome')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('login.signInClient')}</p>

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
            <Button type="submit" variant="gradient" className="w-full" disabled={isPending}>
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              {t('common.signIn')}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">{t('login.demoCredentials')}</p>
            <p className="text-xs font-mono">client@demo.com / Demo@123456</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('login.adminQuestion')}{' '}
          <a href="/login" className="text-primary hover:underline font-medium">{t('login.goToAdmin')}</a>
        </p>
      </div>
    </div>
  );
}
