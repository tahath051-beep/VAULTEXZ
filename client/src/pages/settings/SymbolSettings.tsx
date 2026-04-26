import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/client';
import { Plus, Pencil } from 'lucide-react';

interface Symbol {
  id: string; symbol: string; pip_value_usd: string; broker_spread: string;
  lp_spread: string; markup: string; contract_size: string; asset_class: string; is_active: boolean;
}

type SymbolForm = Omit<Symbol, 'id' | 'markup'>;

const getSymbols = () =>
  api.get<{ success: boolean; data: { symbols: Symbol[] } }>('/settings/symbols').then((r) => r.data.data.symbols);

const createSymbol = (data: SymbolForm) =>
  api.post<{ success: boolean; data: Symbol }>('/settings/symbols', data).then((r) => r.data.data);

const updateSymbol = ({ id, ...data }: Partial<Symbol> & { id: string }) =>
  api.patch<{ success: boolean; data: Symbol }>(`/settings/symbols/${id}`, data).then((r) => r.data.data);

const ASSET_CLASSES = ['FOREX', 'METALS', 'CRYPTO', 'INDICES', 'ENERGY'];

export default function SymbolSettings() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Symbol | null>(null);
  const [assetClass, setAssetClass] = useState('FOREX');

  const { data: symbols = [], isLoading } = useQuery({ queryKey: ['settings-symbols'], queryFn: getSymbols });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SymbolForm>();

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: createSymbol,
    onSuccess: () => {
      toast({ title: 'Symbol added' });
      qc.invalidateQueries({ queryKey: ['settings-symbols'] });
      reset(); setAddOpen(false);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: updateSymbol,
    onSuccess: () => {
      toast({ title: 'Symbol updated' });
      qc.invalidateQueries({ queryKey: ['settings-symbols'] });
      setEditTarget(null);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const openEdit = (s: Symbol) => {
    setEditTarget(s);
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { reset(); setAssetClass('FOREX'); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Symbol
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Asset Class</TableHead>
                <TableHead className="w-28">Pip Value</TableHead>
                <TableHead className="w-28">Broker Spread</TableHead>
                <TableHead className="w-28">LP Spread</TableHead>
                <TableHead className="w-24">Markup</TableHead>
                <TableHead className="w-28">Contract Size</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold font-mono">{s.symbol}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{s.asset_class}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">${s.pip_value_usd}</TableCell>
                  <TableCell className="font-mono text-sm">{s.broker_spread} pips</TableCell>
                  <TableCell className="font-mono text-sm">{s.lp_spread} pips</TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
                    {s.markup} pips
                  </TableCell>
                  <TableCell className="font-mono text-sm">{Number(s.contract_size).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'success' : 'secondary'} className="text-xs">
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(s)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Symbol Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Symbol</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => create({ ...d, asset_class: assetClass }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Symbol <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. EURUSD" {...register('symbol', { required: true })} />
                {errors.symbol && <p className="text-xs text-destructive">Required</p>}
              </div>
              <div className="space-y-1">
                <Label>Asset Class</Label>
                <Select value={assetClass} onValueChange={setAssetClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pip Value (USD) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.01" placeholder="10.00" {...register('pip_value_usd', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Contract Size</Label>
                <Input type="number" placeholder="100000" {...register('contract_size')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Broker Spread (pips) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.1" placeholder="1.5" {...register('broker_spread', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>LP Spread (pips) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.1" placeholder="0.5" {...register('lp_spread', { required: true })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Add Symbol
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Symbol Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit {editTarget.symbol}</DialogTitle></DialogHeader>
            <EditForm symbol={editTarget} onSave={(d) => update({ id: editTarget.id, ...d })} saving={updating} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditForm({ symbol, onSave, saving }: {
  symbol: Symbol;
  onSave: (d: Partial<Symbol>) => void;
  saving: boolean;
}) {
  const [brokerSpread, setBrokerSpread] = useState(symbol.broker_spread);
  const [lpSpread, setLpSpread]         = useState(symbol.lp_spread);
  const [isActive, setIsActive]         = useState(String(symbol.is_active));
  const markup = (Number(brokerSpread) - Number(lpSpread)).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Broker Spread (pips)</Label>
          <Input type="number" step="0.1" value={brokerSpread} onChange={(e) => setBrokerSpread(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>LP Spread (pips)</Label>
          <Input type="number" step="0.1" value={lpSpread} onChange={(e) => setLpSpread(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Markup:</span>
        <span className="font-semibold text-green-700 dark:text-green-400">{markup} pips</span>
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        disabled={saving}
        onClick={() => onSave({ broker_spread: brokerSpread, lp_spread: lpSpread, is_active: isActive === 'true' })}
      >
        {saving && <LoadingSpinner className="h-4 w-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}
