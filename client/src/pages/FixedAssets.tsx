import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fixedAssetsApi } from '@/api/fixedAssets.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function FixedAssetsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    asset_code: '', name: '', purchase_date: '', purchase_cost: '',
    useful_life_years: '', salvage_value: '', location: '', serial_number: '',
  });

  const { data } = useQuery({ queryKey: ['fixed-assets'], queryFn: () => fixedAssetsApi.getAssets() });
  const create = useMutation({
    mutationFn: () => fixedAssetsApi.createAsset(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fixed-assets'] }); setOpen(false); toast({ title: 'Asset created' }); },
  });

  const assets = (data?.data?.data ?? []) as Record<string, string>[];

  const totalCost = assets.reduce((s, a) => s + parseFloat(a.purchase_cost || '0'), 0);
  const totalBookValue = assets.reduce((s, a) => s + parseFloat(a.current_book_value || '0'), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed Assets" subtitle="Asset register, depreciation, and maintenance" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: assets.length },
          { label: 'Total Cost', value: '$' + totalCost.toLocaleString() },
          { label: 'Book Value', value: '$' + totalBookValue.toLocaleString() },
          { label: 'Active', value: assets.filter(a => a.status === 'ACTIVE').length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> Add Asset</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Code','Name','Category','Purchase Date','Cost','Book Value','Location','Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{a.asset_code}</td>
                <td className="px-4 py-2.5 font-medium">{a.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.category_name ?? 'â€”'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.purchase_date?.slice(0,10)}</td>
                <td className="px-4 py-2.5">{parseFloat(a.purchase_cost||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5 font-semibold">{parseFloat(a.current_book_value||'0').toLocaleString()}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.location ?? 'â€”'}</td>
                <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No assets registered</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Register Asset</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {([
              ['asset_code','Asset Code','text'],['name','Name','text'],
              ['purchase_date','Purchase Date','date'],['purchase_cost','Cost','number'],
              ['useful_life_years','Useful Life (years)','number'],['salvage_value','Salvage Value','number'],
              ['location','Location','text'],['serial_number','Serial #','text'],
            ] as [keyof typeof form, string, string][]).map(([f, label, type]) => (
              <Input key={f} placeholder={label} type={type}
                value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
          </div>
          <Button className="w-full mt-2" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Savingâ€¦' : 'Register Asset'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

