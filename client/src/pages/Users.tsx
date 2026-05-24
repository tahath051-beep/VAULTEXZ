import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { fmtDate } from '@/lib/utils';
import { api } from '@/api/client';
import { Plus, UserX } from 'lucide-react';

interface User { id: string; email: string; full_name: string; role_id: string; role_name?: string; is_active: boolean; last_login?: string; created_at: string; }
interface Role { id: string; name: string; }

const getUsers = () => api.get<{ success: boolean; data: { users: User[] } }>('/users').then((r) => r.data.data);
const getRoles = () => api.get<{ success: boolean; data: { roles: Role[] } }>('/users/roles').then((r) => r.data.data);
const createUser = (d: { email: string; password: string; full_name: string; role_id: string }) =>
  api.post<{ success: boolean; data: User }>('/users', d).then((r) => r.data.data);
const deactivateUser = (id: string) => api.patch(`/users/${id}/deactivate`);

export default function Users() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<{
    email: string; password: string; full_name: string; role_id: string;
  }>();

  const { data: usersData, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: getRoles });

  const { mutate: create, isPending } = useMutation({
    mutationFn: createUser,
    onSuccess: () => { toast({ title: 'User created' }); qc.invalidateQueries({ queryKey: ['users'] }); reset(); setOpen(false); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => { toast({ title: 'User deactivated' }); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage system users and roles"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New User</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input {...register('full_name', { required: true })} />
                {errors.full_name && <p className="text-xs text-destructive">Required</p>}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" {...register('email', { required: true })} />
                {errors.email && <p className="text-xs text-destructive">Required</p>}
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" {...register('password', { required: true, minLength: 8 })} />
                {errors.password && <p className="text-xs text-destructive">Min 8 characters</p>}
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select onValueChange={(v) => setValue('role_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {rolesData?.roles?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoadingSpinner className="h-4 w-4" /> : 'Create User'}
              </Button>
            </form>
            </DialogContent>
          </Dialog>
        }
      />

      <SectionCard padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.users?.length ? usersData.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{u.role_name}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                  <TableCell>{fmtDate(u.last_login)}</TableCell>
                  <TableCell>{fmtDate(u.created_at)}</TableCell>
                  <TableCell>
                    {u.is_active && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(u.id)}>
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
      </SectionCard>
    </div>
  );
}
