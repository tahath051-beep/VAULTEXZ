import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { TableSkeleton } from '@/components/shared/SkeletonLoaders';
import { EmptyPayments } from '@/components/shared/EmptyState';
import { getPayments, createPayment, approvePayment, rejectPayment } from '@/api/payments.api';
import { getClients, getClient } from '@/api/clients.api';
import { toast } from '@/hooks/use-toast';
import { fmt, fmtDate } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

const LIMIT = 20;

type PaymentFormData = {
  amount: string;
  currency: string;
  narration: string;
};

export default function Payments() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [statusTab, setStatusTab] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedMT5Id, setSelectedMT5Id] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: { currency: 'USD' },
  });

  const status = statusTab === 'ALL' ? undefined : statusTab;

  const { data, isLoading } = useQuery({
    queryKey: ['payments', offset, statusTab],
    queryFn: () => getPayments({ limit: LIMIT, offset, status }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ limit: 100, is_active: true }),
  });

  const { data: clientDetail } = useQuery({
    queryKey: ['client-detail', selectedClientId],
    queryFn: () => getClient(selectedClientId),
    enabled: !!selectedClientId,
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      const label = modalType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal';
      toast({ title: `${label} created successfully` });
      qc.invalidateQueries({ queryKey: ['payments'] });
      reset();
      setSelectedClientId('');
      setSelectedMT5Id('');
      setSelectedCurrency('USD');
      setModalOpen(false);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed to create payment', variant: 'destructive' }),
  });

  const { mutate: approve } = useMutation({
    mutationFn: approvePayment,
    onSuccess: () => { toast({ title: 'Payment approved' }); qc.invalidateQueries({ queryKey: ['payments'] }); },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const { mutate: reject } = useMutation({
    mutationFn: (id: string) => rejectPayment(id),
    onSuccess: () => { toast({ title: 'Payment rejected' }); qc.invalidateQueries({ queryKey: ['payments'] }); },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const openModal = (type: 'DEPOSIT' | 'WITHDRAWAL') => {
    setModalType(type);
    reset({ currency: 'USD' });
    setSelectedClientId('');
    setSelectedMT5Id('');
    setSelectedCurrency('USD');
    setModalOpen(true);
  };

  const onSubmit = (d: PaymentFormData) => {
    if (!selectedClientId) {
      toast({ title: 'Select a client', variant: 'destructive' });
      return;
    }
    create({
      client_id: selectedClientId,
      mt5_account_id: selectedMT5Id || undefined,
      payment_type: modalType,
      amount: d.amount,
      currency: selectedCurrency,
      narration: d.narration,
    });
  };

  const mt5Accounts = clientDetail?.mt5_accounts ?? [];
  const typeLabel = modalType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        hint={
          <PageHint id="payments" title={t('hint.payments.title')}>
            {t('hint.payments.body')}
          </PageHint>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openModal('WITHDRAWAL')}>
              <ArrowUpCircle className="h-4 w-4 mr-2 text-destructive" />
              New Withdrawal
            </Button>
            <Button onClick={() => openModal('DEPOSIT')}>
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              New Deposit
            </Button>
          </div>
        }
      />

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === 'DEPOSIT'
                ? <ArrowDownCircle className="h-5 w-5 text-success dark:text-green-400" />
                : <ArrowUpCircle className="h-5 w-5 text-destructive dark:text-red-400" />}
              New {typeLabel}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Client <span className="text-destructive">*</span></Label>
              <Select value={selectedClientId} onValueChange={(v) => {
                setSelectedClientId(v);
                setSelectedMT5Id('');
              }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clientsData?.clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name} <span className="text-muted-foreground">({c.client_code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId && mt5Accounts.length > 0 && (
              <div className="space-y-1">
                <Label>MT5 Account</Label>
                <Select value={selectedMT5Id} onValueChange={setSelectedMT5Id}>
                  <SelectTrigger><SelectValue placeholder="Select MT5 account" /></SelectTrigger>
                  <SelectContent>
                    {mt5Accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        #{a.mt5_login} · {a.currency} · {a.book_type}-Book · Balance: ${fmt(a.current_balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('amount', { required: true, min: 0.01 })}
                />
                {errors.amount && <p className="text-xs text-destructive">Required</p>}
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'AED', 'NGN'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Narration</Label>
              <Input
                placeholder={modalType === 'DEPOSIT' ? 'e.g. Wire transfer — HSBC London' : 'e.g. Client withdrawal request'}
                {...register('narration')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
              Submit {typeLabel}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table Card */}
      <SectionCard padded={false}>
        <div className="px-6 pt-4 pb-0">
          <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setOffset(0); }}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-2">
          {isLoading ? <TableSkeleton rows={7} cols={6} /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    {t('payments.col.ref')}
                    <HelpTooltip text="A unique ID number used to track this specific payment" side="bottom" />
                  </span>
                </TableHead>
                <TableHead>{t('payments.col.client')}</TableHead>
                <TableHead>MT5 Login</TableHead>
                <TableHead>{t('payments.col.type')}</TableHead>
                <TableHead>{t('payments.col.amount')}</TableHead>
                <TableHead>{t('payments.col.status')}</TableHead>
                <TableHead>{t('payments.col.date')}</TableHead>
                <TableHead>{t('col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.payments?.length ? data.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.reference_number ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.client_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.client_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{p.mt5_login ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      p.payment_type === 'DEPOSIT' ? 'text-success dark:text-green-400' :
                      p.payment_type === 'WITHDRAWAL' ? 'text-destructive dark:text-red-400' : 'text-primary'
                    }`}>
                      {p.payment_type === 'DEPOSIT'
                        ? <ArrowDownCircle className="h-3 w-3" />
                        : p.payment_type === 'WITHDRAWAL'
                          ? <ArrowUpCircle className="h-3 w-3" />
                          : null}
                      {p.payment_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">
                    ${fmt(p.amount)}{' '}
                    <span className="text-xs text-muted-foreground">{p.currency}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-sm">{fmtDate(p.created_at)}</TableCell>
                  <TableCell>
                    {p.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-success border-green-200 hover:bg-green-50 dark:hover:bg-green-950 dark:border-green-800"
                          onClick={() => approve(p.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-destructive border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => reject(p.id)}
                        >
                          <X className="h-3 w-3 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyPayments />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
          <Pagination
            offset={offset}
            limit={LIMIT}
            hasMore={(data?.payments?.length ?? 0) === LIMIT}
            onChange={setOffset}
          />
        </div>
      </SectionCard>
    </div>
  );
}
