import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner, PageLoader } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { getIBProfile, changeIBPassword } from '@/api/ib.api';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { fmtDate } from '@/lib/utils';
import { KeyRound, Mail, Calendar, CreditCard, TrendingUp, GitBranch } from 'lucide-react';

type PwdForm = { current_password: string; new_password: string; confirm_password: string };

const levelColors: Record<number, string> = {
  1: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  2: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  3: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

function Initials({ name }: { name: string }) {
  const p = name.trim().split(' ');
  const ini = p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2);
  return (
    <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center text-white text-xl font-bold select-none shrink-0">
      {ini.toUpperCase()}
    </div>
  );
}

export default function IBProfile() {
  const { ibUser } = useIBAuthStore();
  const { data: profile, isLoading } = useQuery({ queryKey: ['ib-profile'], queryFn: getIBProfile });
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PwdForm>();

  const { mutate: changePwd, isPending } = useMutation({
    mutationFn: changeIBPassword,
    onSuccess: () => { toast({ title: 'Password changed successfully' }); reset(); },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: e?.response?.data?.error ?? 'Failed to change password', variant: 'destructive' }),
  });

  const onChangePwd = (d: PwdForm) => {
    if (d.new_password !== d.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    changePwd({ current_password: d.current_password, new_password: d.new_password });
  };

  if (isLoading) return <PageLoader />;
  const p = profile ?? ibUser;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">IB account information and settings</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-4">
            <Initials name={p?.full_name ?? 'IB'} />
            <div>
              <p className="text-xl font-bold text-foreground">{p?.full_name}</p>
              <p className="text-sm text-muted-foreground">{p?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-muted font-mono font-medium px-2 py-0.5 rounded border border-border text-foreground">
                  {p?.ib_code}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${levelColors[p?.level ?? 1] ?? levelColors[1]}`}>
                  {p?.level_label} — Level {p?.level}
                </span>
                <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                  {p?.status}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm font-medium text-foreground">{p?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Member Since</p>
                <p className="text-sm font-medium text-foreground">{p?.joined_at ? fmtDate(p.joined_at) : '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission plan */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="font-semibold text-sm text-foreground">Commission Plan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Plan Name</p>
              <p className="text-sm font-semibold text-foreground">{p?.commission_plan}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Rate</p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{p?.commission_rate}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Sub-IB Tier</p>
              <p className="text-sm font-medium text-foreground">You can refer up to 2 levels of sub-IBs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment details */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm text-foreground">Payment Details</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
            <p className="text-sm font-semibold text-foreground">{p?.payment_method}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Bank / Wallet Details</p>
            <p className="text-sm font-mono text-foreground">{p?.bank_details}</p>
          </div>
          <p className="text-xs text-muted-foreground">To update payment details, please contact your account manager.</p>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm text-foreground">Change Password</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Demo password: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Demo@123456</span>
          </p>
          <form onSubmit={handleSubmit(onChangePwd)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password <span className="text-destructive">*</span></Label>
              <Input type="password" {...register('current_password', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>New Password <span className="text-destructive">*</span></Label>
              <Input type="password" {...register('new_password', { required: true, minLength: 8 })} />
              {errors.new_password && <p className="text-xs text-destructive">Minimum 8 characters</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                {...register('confirm_password', {
                  required: true,
                  validate: (v) => v === watch('new_password') || 'Passwords do not match',
                })}
              />
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message ?? 'Required'}</p>
              )}
            </div>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={isPending}>
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
