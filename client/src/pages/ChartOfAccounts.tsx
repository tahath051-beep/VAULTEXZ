import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getCOA, createCOAAccount, updateCOAAccount } from '@/api/coa.api';
import type { COAAccount } from '@/api/coa.api';
import { toast } from '@/hooks/use-toast';
import { Lock, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;

const typeColors: Record<string, string> = {
  ASSET:     'bg-blue-50   text-blue-800   dark:bg-blue-950   dark:text-blue-200   border-blue-200   dark:border-blue-800',
  LIABILITY: 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  EQUITY:    'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  REVENUE:   'bg-green-50  text-green-800  dark:bg-green-950  dark:text-green-200  border-green-200  dark:border-green-800',
  EXPENSE:   'bg-red-50    text-red-800    dark:bg-red-950    dark:text-red-200    border-red-200    dark:border-red-800',
};

const typeBadgeColors: Record<string, string> = {
  ASSET:     'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200',
  LIABILITY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EQUITY:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  REVENUE:   'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
  EXPENSE:   'bg-red-100    text-red-800    dark:bg-red-900    dark:text-red-200',
};

type FormData = {
  code: string;
  name: string;
  type: string;
  normal_balance: string;
  subtype: string;
};

export default function ChartOfAccounts() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>();

  const { data, isLoading } = useQuery({
    queryKey: ['coa', typeFilter],
    queryFn: () => getCOA({ type: typeFilter === 'ALL' ? undefined : typeFilter }),
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: createCOAAccount,
    onSuccess: () => {
      toast({ title: 'Account created' });
      qc.invalidateQueries({ queryKey: ['coa'] });
      reset();
      setOpen(false);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateCOAAccount(id, { is_active }),
    onSuccess: (updated) => {
      toast({ title: `Account ${updated.is_active ? 'activated' : 'deactivated'}` });
      qc.invalidateQueries({ queryKey: ['coa'] });
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Cannot modify', description: e?.response?.data?.error ?? 'System accounts cannot be changed', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  const accounts: COAAccount[] = data?.accounts ?? [];

  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    const filtered = accounts.filter((a) => a.type === type);
    if (filtered.length) acc[type] = filtered;
    return acc;
  }, {} as Record<string, COAAccount[]>);

  const activeTypes = (typeFilter !== 'ALL' ? [typeFilter as typeof ACCOUNT_TYPES[number]] : ACCOUNT_TYPES).filter(
    (t) => grouped[t]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">Account structure for double-entry bookkeeping</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Code <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. 1150" {...register('code', { required: true })} />
                  {errors.code && <p className="text-xs text-destructive">Required</p>}
                </div>
                <div className="space-y-1">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="Account name" {...register('name', { required: true })} />
                  {errors.name && <p className="text-xs text-destructive">Required</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(v) => setValue('type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Normal Balance <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(v) => setValue('normal_balance', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEBIT">DEBIT</SelectItem>
                      <SelectItem value="CREDIT">CREDIT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subtype <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. CASH, RECEIVABLE" {...register('subtype')} />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type filter */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          System accounts cannot be edited
        </div>
      </div>

      {/* Grouped account sections */}
      <div className="space-y-4">
        {activeTypes.map((type) => {
          const typeAccounts = grouped[type] ?? [];
          return (
            <Card key={type} className="overflow-hidden">
              <div className={`px-4 py-2.5 border-b font-semibold text-sm flex items-center justify-between ${typeColors[type]}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeBadgeColors[type]}`}>{type}</span>
                  <span className="font-normal opacity-70">{typeAccounts.length} account{typeAccounts.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="font-normal text-xs opacity-60">
                  {typeAccounts.filter((a) => a.is_active).length} active
                </span>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-32">Subtype</TableHead>
                      <TableHead className="w-32">Normal Balance</TableHead>
                      <TableHead className="w-20">Parent</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((a) => (
                      <TableRow key={a.id} className={!a.is_active ? 'opacity-50' : undefined}>
                        <TableCell className="font-mono font-semibold text-sm">{a.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {a.is_system && (
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <span>{a.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.subtype ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${a.normal_balance === 'DEBIT' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                            {a.normal_balance}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {a.parent_code ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.is_active ? 'success' : 'secondary'} className="text-xs">
                            {a.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!a.is_system ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              title={a.is_active ? 'Deactivate account' : 'Activate account'}
                              onClick={() => toggle({ id: a.id, is_active: !a.is_active })}
                            >
                              {a.is_active
                                ? <ToggleRight className="h-4 w-4 text-green-600" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          ) : (
                            <div className="h-7 w-8" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {activeTypes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No accounts found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
