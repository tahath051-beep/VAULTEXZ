import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from '@/hooks/use-toast';
import { getClientTransactions, getClientAccounts, requestWithdrawal, requestDeposit } from '@/api/clientPortal.api';
import { fmt, fmtDate } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const LIMIT = 20;

const statusVariant = (s: string): 'success' | 'secondary' | 'destructive' =>
  s === 'APPROVED' ? 'success' : s === 'PENDING' ? 'secondary' : 'destructive';

// ── Deposit Modal ────────────────────────────────────────────────────────────
type DepositForm = { amount: string; gateway: string; reference: string };

function DepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });
  const [selectedAcct, setSelectedAcct] = useState(accounts[0]?.id ?? '');
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DepositForm>();

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (d: DepositForm) => requestDeposit({
      mt5_account_id: selectedAcct,
      amount: Number(d.amount),
      gateway: d.gateway,
      reference: d.reference,
    }),
    onSuccess: () => {
      toast({ title: 'Deposit request submitted — pending approval' });
      qc.invalidateQueries({ queryKey: ['client-transactions'] });
      qc.invalidateQueries({ queryKey: ['client-dashboard'] });
      reset();
      onClose();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: e?.response?.data?.error ?? 'Failed to submit request', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Deposit Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => submit(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>MT5 Account</Label>
            <Select value={selectedAcct || accounts[0]?.id} onValueChange={setSelectedAcct}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.mt5_login} · {a.account_type} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (USD) <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 1, message: 'Minimum $1' },
              })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setValue('gateway', v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Wire">Bank Wire</SelectItem>
                <SelectItem value="Crypto (USDT)">Crypto (USDT)</SelectItem>
                <SelectItem value="Crypto (BTC)">Crypto (BTC)</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register('gateway', { required: 'Please select a payment method' })} />
            {errors.gateway && <p className="text-xs text-destructive">{errors.gateway.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Reference / Transaction ID</Label>
            <Input placeholder="e.g. TXN123456 or TXHASH..." {...register('reference')} />
          </div>
          <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            Your deposit will be reviewed and credited to your account within 1–24 hours after confirmation.
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Submit Deposit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Withdrawal Modal ─────────────────────────────────────────────────────────
type WithdrawForm = { amount: string; gateway: string; details: string };

function WithdrawModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery({ queryKey: ['client-accounts'], queryFn: getClientAccounts });
  const [selectedAcct, setSelectedAcct] = useState(accounts[0]?.id ?? '');
  const acct = accounts.find((a) => a.id === selectedAcct) ?? accounts[0];
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<WithdrawForm>();

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (d: WithdrawForm) => requestWithdrawal({
      mt5_account_id: selectedAcct,
      amount: Number(d.amount),
      gateway: d.gateway,
      details: d.details,
    }),
    onSuccess: () => {
      toast({ title: 'Withdrawal request submitted' });
      qc.invalidateQueries({ queryKey: ['client-transactions'] });
      qc.invalidateQueries({ queryKey: ['client-dashboard'] });
      reset();
      onClose();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: e?.response?.data?.error ?? 'Failed to submit request', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Withdrawal Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => submit(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>MT5 Account</Label>
            <Select value={selectedAcct || accounts[0]?.id} onValueChange={setSelectedAcct}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.mt5_login} · {a.account_type} (${fmt(a.balance)} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {acct && (
              <p className="text-xs text-muted-foreground">
                Available: <span className="font-semibold text-foreground">${fmt(acct.balance)}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Amount (USD) <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 1, message: 'Minimum $1' },
                max: { value: acct?.balance ?? 999999, message: 'Exceeds available balance' },
              })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Withdrawal Method <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setValue('gateway', v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Wire">Bank Wire</SelectItem>
                <SelectItem value="Crypto (USDT)">Crypto (USDT)</SelectItem>
                <SelectItem value="Crypto (BTC)">Crypto (BTC)</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register('gateway', { required: 'Please select a withdrawal method' })} />
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
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <LoadingSpinner className="h-4 w-4 mr-2" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ClientTransactions() {
  const [tab, setTab]           = useState('ALL');
  const [offset, setOffset]     = useState(0);
  const [showDeposit, setDeposit] = useState(false);
  const [showWithdraw, setWithdraw] = useState(false);

  const type = tab === 'ALL' ? undefined : tab;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['client-transactions', tab, offset],
    queryFn: () => getClientTransactions({ type, limit: LIMIT, offset }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Deposits and withdrawals history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeposit(true)}>
            <ArrowDownToLine className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
            Deposit
          </Button>
          <Button onClick={() => setWithdraw(true)}>
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setOffset(0); }}>
            <TabsList className="h-9">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="DEPOSIT">Deposits</TabsTrigger>
              <TabsTrigger value="WITHDRAWAL">Withdrawals</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-32">Amount</TableHead>
                  <TableHead className="w-24">Currency</TableHead>
                  <TableHead className="w-32">Amount USD</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="w-24">Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <LoadingSpinner className="h-6 w-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(t.date)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        t.type === 'DEPOSIT'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      }`}>{t.type}</span>
                    </TableCell>
                    <TableCell className={`font-mono font-semibold ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {t.type === 'DEPOSIT' ? '+' : '-'}${fmt(t.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{t.currency}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">${fmt(t.amount_usd)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)} className="text-xs">{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.gateway}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.reference}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.mt5_login}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination offset={offset} limit={LIMIT} hasMore={transactions.length === LIMIT} onChange={setOffset} />
        </CardContent>
      </Card>

      <DepositModal  open={showDeposit}  onClose={() => setDeposit(false)} />
      <WithdrawModal open={showWithdraw} onClose={() => setWithdraw(false)} />
    </div>
  );
}
