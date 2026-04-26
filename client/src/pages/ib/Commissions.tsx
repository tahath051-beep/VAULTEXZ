import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { getIBCommissions, requestIBPayout } from '@/api/ib.api';
import { fmt, fmtDate } from '@/lib/utils';
import { ArrowUpFromLine } from 'lucide-react';

const statusVariant = (s: string): 'success' | 'secondary' | 'destructive' | 'outline' =>
  s === 'PAID' ? 'success' : s === 'LOCKED' ? 'secondary' : s === 'PENDING' ? 'outline' : 'secondary';

const statusColors: Record<string, string> = {
  PAID:    'text-green-600 dark:text-green-400',
  LOCKED:  'text-blue-600 dark:text-blue-400',
  PENDING: 'text-yellow-600 dark:text-yellow-400',
};

type PayoutForm = { gateway: string; details: string };

function PayoutModal({ open, onClose, lockedAmount }: { open: boolean; onClose: () => void; lockedAmount: number }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PayoutForm>();

  const { mutate: submit, isPending } = useMutation({
    mutationFn: requestIBPayout,
    onSuccess: ({ amount }) => {
      toast({ title: `Payout of $${fmt(amount)} requested successfully` });
      qc.invalidateQueries({ queryKey: ['ib-commissions'] });
      qc.invalidateQueries({ queryKey: ['ib-dashboard'] });
      reset();
      onClose();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: e?.response?.data?.error ?? 'Failed to request payout', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
        </DialogHeader>
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-2">
          <p className="text-sm text-muted-foreground">Available (Locked)</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${fmt(lockedAmount)}</p>
        </div>
        {lockedAmount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No locked commissions available for payout.<br />
            Commissions must be in LOCKED status before requesting payout.
          </p>
        ) : (
          <form onSubmit={handleSubmit((d) => submit(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payment Method <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => setValue('gateway', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Wire">Bank Wire</SelectItem>
                  <SelectItem value="Crypto (USDT)">Crypto (USDT)</SelectItem>
                  <SelectItem value="Crypto (BTC)">Crypto (BTC)</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('gateway', { required: 'Please select a payment method' })} />
              {errors.gateway && <p className="text-xs text-destructive">{errors.gateway.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Bank / Wallet Details <span className="text-destructive">*</span></Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="Bank name, account number, IBAN, or wallet address..."
                {...register('details', { required: true })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" disabled={isPending}>
                {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
                Request Payout
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function IBCommissions() {
  const [tab, setTab]           = useState('ALL');
  const [showPayout, setShowPayout] = useState(false);

  const status = tab === 'ALL' ? undefined : tab;

  const { data, isLoading } = useQuery({
    queryKey: ['ib-commissions', tab],
    queryFn: () => getIBCommissions(status),
  });

  const commissions = data?.commissions ?? [];
  const summary     = data?.summary;
  const lockedAmt   = summary?.total_locked ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your earned commissions</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setShowPayout(true)}
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          Request Payout
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pending',      value: `$${fmt(summary?.total_pending ?? 0)}`,    color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Total Locked',       value: `$${fmt(summary?.total_locked ?? 0)}`,     color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Paid This Month',    value: `$${fmt(summary?.total_paid_month ?? 0)}`, color: 'text-green-600 dark:text-green-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v)}>
            <TabsList className="h-9">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="LOCKED">Locked</TabsTrigger>
              <TabsTrigger value="PAID">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="w-24">Symbol</TableHead>
                  <TableHead className="w-20">Volume</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-28">Amount</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-28">Ticket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <LoadingSpinner className="h-6 w-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      No commissions found
                    </TableCell>
                  </TableRow>
                ) : commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(c.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.client}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.client_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{c.symbol}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{c.volume.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.commission_type}</TableCell>
                    <TableCell className={`font-mono font-semibold ${statusColors[c.status] ?? 'text-foreground'}`}>
                      ${fmt(c.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status)} className="text-xs">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{c.ticket}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PayoutModal open={showPayout} onClose={() => setShowPayout(false)} lockedAmount={lockedAmt} />
    </div>
  );
}
