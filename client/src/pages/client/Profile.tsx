import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner, PageLoader } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { getClientProfile, getClientAccounts, changeClientPassword } from '@/api/clientPortal.api';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import { fmt, fmtDate } from '@/lib/utils';
import { Phone, MapPin, KeyRound, GitBranch, Calendar } from 'lucide-react';

type PwdForm = { current_password: string; new_password: string; confirm_password: string };

const kycVariant = (s: string): 'success' | 'secondary' | 'destructive' =>
  s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'destructive' : 'secondary';

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const ini = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold select-none shrink-0">
      {ini.toUpperCase()}
    </div>
  );
}

export default function ClientProfile() {
  const { clientUser } = useClientAuthStore();
  const { data: profile, isLoading } = useQuery({ queryKey: ['client-profile'], queryFn: getClientProfile });
  const { data: accounts = [] }       = useQuery({ queryKey: ['client-accounts'],  queryFn: getClientAccounts });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PwdForm>();

  const { mutate: changePwd, isPending } = useMutation({
    mutationFn: changeClientPassword,
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

  const p = profile ?? clientUser;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Account information and settings</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-4">
            <Initials name={p?.full_name ?? 'U'} />
            <div>
              <p className="text-xl font-bold text-foreground">{p?.full_name}</p>
              <p className="text-sm text-muted-foreground">{p?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  {p?.client_code}
                </span>
                <Badge variant={kycVariant(p?.kyc_status ?? '')} className="text-xs">
                  KYC: {p?.kyc_status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {p?.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="font-mono text-foreground">{p.phone}</p>
                </div>
              </div>
            )}
            {p?.country && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Country</p>
                  <p className="font-medium text-foreground">{p.country}</p>
                </div>
              </div>
            )}
            {p?.created_at && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Member Since</p>
                  <p className="font-medium text-foreground">{fmtDate(p.created_at)}</p>
                </div>
              </div>
            )}
            {p?.linked_ib && (
              <div className="flex items-start gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Linked IB</p>
                  <p className="font-medium text-foreground">{p.linked_ib}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MT5 Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="font-semibold text-sm text-foreground mb-3">MT5 Accounts</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Equity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-semibold text-foreground">{a.mt5_login}</TableCell>
                    <TableCell className="text-foreground">{a.account_type}</TableCell>
                    <TableCell className="text-foreground">{a.currency}</TableCell>
                    <TableCell className="text-foreground">1:{a.leverage}</TableCell>
                    <TableCell className="font-mono text-foreground">${fmt(a.balance)}</TableCell>
                    <TableCell className="font-mono text-primary">${fmt(a.equity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
            <Button type="submit" disabled={isPending}>
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
