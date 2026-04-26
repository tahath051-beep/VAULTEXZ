import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getClients, createClient } from '@/api/clients.api';
import { toast } from '@/hooks/use-toast';
import { fmtDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const schema = z.object({
  client_code: z.string().min(1),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const LIMIT = 20;

export default function Clients() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', offset, search],
    queryFn: () => getClients({ limit: LIMIT, offset, ...(search ? {} : {}) }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate: create, isPending } = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast({ title: 'Client created', variant: 'default' });
      qc.invalidateQueries({ queryKey: ['clients'] });
      reset(); setOpen(false);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage client accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
              {(['client_code', 'full_name', 'email', 'phone', 'country'] as const).map((f) => (
                <div key={f} className="space-y-1">
                  <Label htmlFor={f}>{f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
                  <Input id={f} {...register(f)} />
                  {errors[f] && <p className="text-xs text-destructive">{errors[f]?.message}</p>}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoadingSpinner className="h-4 w-4" /> : 'Create Client'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>MT5 Accounts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.clients?.length ? data.clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.client_code}</TableCell>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.country ?? '-'}</TableCell>
                  <TableCell>{c.mt5_account_count ?? 0}</TableCell>
                  <TableCell><StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                  <TableCell>{fmtDate(c.created_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/clients/${c.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No clients found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination offset={offset} limit={LIMIT} hasMore={(data?.clients?.length ?? 0) === LIMIT} onChange={setOffset} />
        </CardContent>
      </Card>
    </div>
  );
}
