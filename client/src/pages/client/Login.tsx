import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { clientLogin } from '@/api/clientPortal.api';
import { useMutation } from '@tanstack/react-query';

type LoginForm = { email: string; password: string };

export default function ClientLogin() {
  const { token, setAuth } = useClientAuthStore();
  const navigate = useNavigate();

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
    onError: () => toast({ title: 'Invalid email or password', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-xl">FX</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">FX Accounting</h1>
          <p className="text-primary font-medium mt-1">Client Portal</p>
        </div>

        <Card>
          <CardContent className="pt-6 pb-8 px-8">
            <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your client account</p>

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
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
              <p className="text-xs text-foreground font-mono">client@demo.com / Demo@123456</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin?{' '}
          <a href="/login" className="text-primary hover:underline">Go to Admin Panel</a>
        </p>
      </div>
    </div>
  );
}
