import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { User, Clock } from 'lucide-react';
import { fmtDateTime } from '@/lib/utils';

interface UserProfile {
  id: string; email: string; full_name: string; role: string; last_login?: string; created_at?: string;
}

const getProfile = () =>
  api.get<{ success: boolean; data: UserProfile }>('/profile').then((r) => r.data.data);

const changePassword = (d: { current_password: string; new_password: string }) =>
  api.post<{ success: boolean; data: { message: string } }>('/profile/change-password', d).then((r) => r.data.data);

type PwdForm = { current_password: string; new_password: string; confirm_password: string };

export default function Profile() {
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { mutate: savePwd, isPending: savingPwd } = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast({ title: 'Password changed successfully' });
      pwdReset();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const { register: pwdReg, handleSubmit: pwdSubmit, reset: pwdReset, formState: { errors: pwdErrors }, watch } = useForm<PwdForm>();

  const onChangePwd = (d: PwdForm) => {
    if (d.new_password !== d.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    savePwd({ current_password: d.current_password, new_password: d.new_password });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const displayProfile = profile ?? (user as unknown as UserProfile);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile" subtitle="Account information and security settings" />

      {/* Profile Info */}
      <SectionCard title="Profile" bodyClassName="pt-0 space-y-5 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{displayProfile?.full_name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{displayProfile?.email}</p>
              {displayProfile?.role && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {displayProfile.role}
                </span>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email</p>
              <p className="font-mono">{displayProfile?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Role</p>
              <p className="font-medium">{displayProfile?.role ?? '—'}</p>
            </div>
            {profile?.last_login && (
              <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last login: {fmtDateTime(profile.last_login)}</span>
              </div>
            )}
          </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="Change Password" bodyClassName="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Demo password: <span className="font-mono">demo1234</span>
          </p>
          <form onSubmit={pwdSubmit(onChangePwd)} className="space-y-4">
            <div className="space-y-1">
              <Label>Current Password <span className="text-destructive">*</span></Label>
              <Input type="password" {...pwdReg('current_password', { required: true })} />
              {pwdErrors.current_password && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1">
              <Label>New Password <span className="text-destructive">*</span></Label>
              <Input type="password" {...pwdReg('new_password', { required: true, minLength: 8 })} />
              {pwdErrors.new_password && <p className="text-xs text-destructive">Min 8 characters</p>}
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                {...pwdReg('confirm_password', {
                  required: true,
                  validate: (v) => v === watch('new_password') || 'Passwords do not match',
                })}
              />
              {pwdErrors.confirm_password && (
                <p className="text-xs text-destructive">{pwdErrors.confirm_password.message ?? 'Required'}</p>
              )}
            </div>
            <Button type="submit" disabled={savingPwd}>
              {savingPwd && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Change Password
            </Button>
          </form>
      </SectionCard>
    </div>
  );
}
