import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus } from 'lucide-react';

export default function BranchesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', country: '', city: '', address: '', phone: '', email: '' });

  const { data } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.getBranches() });
  const create = useMutation({
    mutationFn: () => branchesApi.createBranch(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); setOpen(false); toast({ title: 'Branch created' }); },
  });

  const branches = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-6">
      <PageHeader title="Branches" subtitle="Manage offices and departments across all locations" icon={<Building2 className="h-5 w-5" />} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Branches</p>
          <p className="text-2xl font-bold mt-1">{branches.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{branches.filter(b => b.is_active !== 'false').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Countries</p>
          <p className="text-2xl font-bold mt-1">{new Set(branches.map(b => b.country)).size}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> Add Branch</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{b.code}</p>
              </div>
              <StatusBadge status={b.is_active !== 'false' ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {b.city && <p>{b.city}{b.country ? `, ${b.country}` : ''}</p>}
              {b.phone && <p>{b.phone}</p>}
              {b.email && <p>{b.email}</p>}
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No branches yet — add your first office</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {([['name','Name'],['code','Code (e.g. HQ)'],['country','Country'],['city','City'],['address','Address'],['phone','Phone'],['email','Email']] as [keyof typeof form, string][]).map(([f, label]) => (
              <Input key={f} placeholder={label} value={form[f]} className={f === 'address' || f === 'name' ? 'col-span-2' : ''}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
          </div>
          <Button className="w-full mt-2" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Branch'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
