import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletsApi } from '@/api/wallets.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function WalletsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ type: 'CREDIT' as 'CREDIT' | 'DEBIT', amount: '', currency: 'USD', description: '' });

  const { data } = useQuery({ queryKey: ['wallets'], queryFn: () => walletsApi.getWallets() });
  const { data: txData } = useQuery({
    queryKey: ['wallet-txs', selected],
    queryFn: () => walletsApi.getTransactions(selected!),
    enabled: !!selected,
  });
  const adjust = useMutation({
    mutationFn: () => walletsApi.adjust(selected!, { ...adjustForm, amount: parseFloat(adjustForm.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['wallet-txs', selected] });
      setAdjustOpen(false);
      toast({ title: 'Adjustment recorded' });
    },
  });

  const wallets = (data?.data?.data ?? []) as Record<string, string>[];
  const txs = (txData?.data?.data ?? []) as Record<string, string>[];
  const selectedWallet = wallets.find(w => w.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader title="Wallets" subtitle="Internal cash wallets and transaction history" icon={<Wallet className="h-5 w-5" />} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const balance = parseFloat(w.balance || '0');
          const isSelected = selected === w.id;
          return (
            <button key={w.id} onClick={() => setSelected(isSelected ? null : w.id)}
              className={`rounded-xl border p-5 text-start transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/20'}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{w.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{w.currency}</p>
              </div>
              <p className={`text-2xl font-bold mt-3 ${balance < 0 ? 'text-red-400' : ''}`}>
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{w.wallet_type?.replace(/_/g,' ')}</p>
            </button>
          );
        })}
        {wallets.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No wallets configured</p>
          </div>
        )}
      </div>

      {selected && selectedWallet && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{selectedWallet.name} — Transactions</h2>
            <Button size="sm" onClick={() => setAdjustOpen(true)}>Adjust Balance</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  {['Date','Type','Description','Reference','Amount','Balance After'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 font-semibold ${t.transaction_type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.transaction_type === 'CREDIT'
                          ? <ArrowUpCircle className="h-3.5 w-3.5" />
                          : <ArrowDownCircle className="h-3.5 w-3.5" />}
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{t.description}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.reference ?? '—'}</td>
                    <td className={`px-4 py-2.5 font-semibold ${t.transaction_type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.transaction_type === 'CREDIT' ? '+' : '-'}{parseFloat(t.amount||'0').toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">{parseFloat(t.balance_after||'0').toLocaleString()}</td>
                  </tr>
                ))}
                {txs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Wallet Balance</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              {(['CREDIT','DEBIT'] as const).map(t => (
                <button key={t} onClick={() => setAdjustForm(p => ({ ...p, type: t }))}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${adjustForm.type === t ? (t === 'CREDIT' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400') : 'border-border text-muted-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
            <Input placeholder="Amount" type="number" value={adjustForm.amount} onChange={e => setAdjustForm(p => ({ ...p, amount: e.target.value }))} />
            <Input placeholder="Currency (e.g. USD)" value={adjustForm.currency} onChange={e => setAdjustForm(p => ({ ...p, currency: e.target.value }))} />
            <Input placeholder="Description" value={adjustForm.description} onChange={e => setAdjustForm(p => ({ ...p, description: e.target.value }))} />
            <Button className="w-full" onClick={() => adjust.mutate()} disabled={adjust.isPending}>
              {adjust.isPending ? 'Saving…' : 'Record Adjustment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
