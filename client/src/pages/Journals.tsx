import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/Pagination';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { TableSkeleton } from '@/components/shared/SkeletonLoaders';
import { EmptyJournals } from '@/components/shared/EmptyState';
import { getJournals, createJournal } from '@/api/journals.api';
import { getCOA } from '@/api/coa.api';
import { toast } from '@/hooks/use-toast';
import { fmt, fmtDate } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const LIMIT = 20;

interface FormData {
  narration: string;
  entry_date: string;
  lines: { account_id: string; debit: string; credit: string; }[];
}

export default function Journals() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['journals', offset],
    queryFn: () => getJournals({ limit: LIMIT, offset }),
  });

  // Load COA accounts for the account selector
  const { data: coaData } = useQuery({
    queryKey: ['coa-active'],
    queryFn: () => getCOA({ is_active: true }),
    staleTime: 5 * 60_000,
  });
  const coaAccounts = coaData?.accounts ?? [];

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<FormData>({
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      lines: [
        { account_id: '', debit: '0', credit: '0' },
        { account_id: '', debit: '0', credit: '0' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');
  const totalDebit  = lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const { mutate: create, isPending } = useMutation({
    mutationFn: createJournal,
    onSuccess: () => {
      toast({ title: 'Journal posted' });
      qc.invalidateQueries({ queryKey: ['journals'] });
      reset({
        entry_date: new Date().toISOString().slice(0, 10),
        lines: [
          { account_id: '', debit: '0', credit: '0' },
          { account_id: '', debit: '0', credit: '0' },
        ],
      });
      setOpen(false);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });


  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        subtitle="Manual double-entry journal posts"
        actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Journal</Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Post Manual Journal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Narration <span className="text-destructive">*</span></Label>
                  <Input {...register('narration', { required: true })} placeholder="e.g. Month-end accrual" />
                </div>
                <div className="space-y-1">
                  <Label>Entry Date <span className="text-destructive">*</span></Label>
                  <Input type="date" {...register('entry_date', { required: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lines</Label>
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => append({ account_id: '', debit: '0', credit: '0' })}
                  >
                    <Plus className="h-3 w-3 mr-1" />Add Line
                  </Button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_110px_110px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Account</span>
                  <span>Debit (DR)</span>
                  <span>Credit (CR)</span>
                  <span />
                </div>

                {fields.map((f, i) => (
                  <div key={f.id} className="grid grid-cols-[1fr_110px_110px_32px] gap-2 items-center">
                    {/* Account selector — code + name dropdown */}
                    <Select
                      value={lines[i]?.account_id ?? ''}
                      onValueChange={(v) => setValue(`lines.${i}.account_id`, v)}
                    >
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {coaAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="text-sm">
                            <span className="font-mono text-xs text-muted-foreground mr-2">{a.code}</span>
                            {a.name}
                          </SelectItem>
                        ))}
                        {coaAccounts.length === 0 && (
                          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                            Loading accounts…
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    <Input
                      className="text-sm font-mono h-9"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`lines.${i}.debit`)}
                    />
                    <Input
                      className="text-sm font-mono h-9"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`lines.${i}.credit`)}
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-8 w-8"
                      onClick={() => remove(i)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Totals row */}
                <div className="grid grid-cols-[1fr_110px_110px_32px] gap-2 pt-1 border-t text-sm font-semibold">
                  <span className="text-right pr-2 text-muted-foreground">Totals</span>
                  <span className={`font-mono ${!balanced ? 'text-destructive' : 'text-green-600'}`}>
                    {fmt(totalDebit)}
                  </span>
                  <span className={`font-mono ${!balanced ? 'text-destructive' : 'text-green-600'}`}>
                    {fmt(totalCredit)}
                  </span>
                  <span />
                </div>
                {!balanced && (
                  <p className="text-xs text-destructive font-medium">
                    ⚠ Debits must equal credits (difference: {fmt(Math.abs(totalDebit - totalCredit))})
                  </p>
                )}
                {balanced && totalDebit > 0 && (
                  <p className="text-xs text-success dark:text-green-400 font-medium">✓ Journal is balanced</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending || !balanced || totalDebit === 0}>
                {isPending ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
                Post Journal Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <SectionCard padded={false}>
          {isLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead className="w-16 text-right">Lines</TableHead>
                <TableHead className="w-36 text-right">Total DR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.journals?.length ? data.journals.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="text-sm tabular-nums">{fmtDate(j.entry_date)}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{j.reference_type}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{j.narration}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{j.lines?.length ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">
                    ${fmt(j.lines?.reduce((s, l) => s + Number(l.debit), 0))}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyJournals />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
          <Pagination
            offset={offset}
            limit={LIMIT}
            hasMore={(data?.journals?.length ?? 0) === LIMIT}
            onChange={setOffset}
          />
      </SectionCard>
    </div>
  );
}
