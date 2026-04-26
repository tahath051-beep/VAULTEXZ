import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { ibLogin } from '@/api/ib.api';
import { useMutation } from '@tanstack/react-query';

type LoginForm = { email: string; password: string };

export default function IBLogin() {
  const { token, setAuth } = useIBAuthStore();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-500 mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">IB</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">FX Accounting</h1>
          <p className="text-amber-600 dark:text-amber-400 font-medium mt-1">IB Portal</p>
        </div>

        <Card>
          <CardContent className="pt-6 pb-8 px-8">
            <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your IB account</p>

            <form onSubmit={handleSubmit((d) => login(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { required: true })}
                  className={errors.email ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                  className={errors.password ? 'border-destructive' : ''}
                />
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={isPending}>
                {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
              <p className="text-xs text-foreground font-mono">ib@demo.com / Demo@123456</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin?{' '}
          <a href="/login" className="text-amber-600 dark:text-amber-400 hover:underline">Go to Admin Panel</a>
        </p>
      </div>
    </div>
  );
}
