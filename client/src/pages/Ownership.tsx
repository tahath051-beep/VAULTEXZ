import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownershipApi } from '@/api/ownership.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Plus, TrendingUp } from 'lucide-react';

function ShareholdersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', nationality: '', ownership_pct: '' });
  const { data } = useQuery({ queryKey: ['shareholders'], queryFn: () => ownershipApi.getShareholders() });
  const create = useMutation({
    mutationFn: () => ownershipApi.createShareholder(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shareholders'] }); setOpen(false); toast({ title: 'Shareholder added' }); },
  });

  const shareholders = (data?.data?.data ?? []) as Record<string, string>[];
  const totalPct = shareholders.reduce((s, sh) => s + parseFloat(sh.ownership_pct || '0'), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total ownership: <span className={totalPct === 100 ? 'text-green-500 font-semibold' : 'text-amber-500 font-semibold'}>{totalPct.toFixed(4)}%</span>
          {totalPct !== 100 && <span className="ms-2 text-amber-500">(must equal 100%)</span>}
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> Add Shareholder</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Name','Email','Nationality','Ownership %','Share Class'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shareholders.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{s.full_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-2.5">{s.nationality}</td>
                <td className="px-4 py-2.5 font-semibold">{parseFloat(s.ownership_pct).toFixed(4)}%</td>
                <td className="px-4 py-2.5">{s.share_class}</td>
              </tr>
            ))}
            {shareholders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No shareholders</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shareholder</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Full Name" value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} />
            <Input placeholder="Email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} />
            <Input placeholder="Nationality (2-letter)" value={form.nationality} onChange={e => setForm(p=>({...p,nationality:e.target.value}))} />
            <Input placeholder="Ownership %" type="number" value={form.ownership_pct} onChange={e => setForm(p=>({...p,ownership_pct:e.target.value}))} />
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Savingâ€¦' : 'Add Shareholder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DistributionsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ period_year: '', period_month: '', total_profit: '', distributable: '', retained: '' });
  const { data } = useQuery({ queryKey: ['distributions'], queryFn: () => ownershipApi.getDistributions() });
  const create = useMutation({
    mutationFn: () => ownershipApi.createDistribution(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributions'] }); setOpen(false); toast({ title: 'Distribution created' }); },
  });
  const approve = useMutation({
    mutationFn: (id: string) => ownershipApi.approveDistribution(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributions'] }); toast({ title: 'Distribution approved' }); },
  });

  const distributions = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> New Distribution</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Period','Total Profit','Distributable','Retained','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {distributions.map((d) => (
              <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{d.period_year}{d.period_month ? `-${String(d.period_month).padStart(2,'0')}` : ''}</td>
                <td className="px-4 py-2.5">{parseFloat(d.total_profit||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5 font-semibold">{parseFloat(d.distributable||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{parseFloat(d.retained||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-2.5">
                  {d.status === 'DRAFT' && (
                    <Button size="sm" variant="outline" onClick={() => approve.mutate(d.id)}>Approve</Button>
                  )}
                </td>
              </tr>
            ))}
            {distributions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No distributions</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Profit Distribution</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {([['period_year','Year','number'],['period_month','Month (optional)','number'],
               ['total_profit','Total Profit','number'],['distributable','Distributable Amount','number'],
               ['retained','Retained Earnings','number']] as [keyof typeof form,string,string][]).map(([f,label,type])=>(
              <Input key={f} placeholder={label} type={type} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} />
            ))}
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Creatingâ€¦' : 'Create Distribution'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OwnershipPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ownership Management" subtitle="Shareholders, contributions, and profit distribution" />
      <Tabs defaultValue="shareholders">
        <TabsList>
          <TabsTrigger value="shareholders"><PieChart className="h-3.5 w-3.5 me-1.5" />Shareholders</TabsTrigger>
          <TabsTrigger value="distributions"><TrendingUp className="h-3.5 w-3.5 me-1.5" />Profit Distributions</TabsTrigger>
        </TabsList>
        <TabsContent value="shareholders" className="mt-4"><ShareholdersTab /></TabsContent>
        <TabsContent value="distributions" className="mt-4"><DistributionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

