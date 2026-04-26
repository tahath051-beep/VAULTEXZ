import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/Pagination';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getJournals, createJournal } from '@/api/journals.api';
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

  const { register, handleSubmit, control, reset, watch } = useForm<FormData>({
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      lines: [{ account_id: '', debit: '0', credit: '0' }, { account_id: '', debit: '0', credit: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const { mutate: create, isPending } = useMutation({
    mutationFn: createJournal,
    onSuccess: () => { toast({ title: 'Journal posted' }); qc.invalidateQueries({ queryKey: ['journals'] }); reset(); setOpen(false); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal Entries</h1>
          <p className="text-muted-foreground">Manual double-entry journal posts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Journal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Post Manual Journal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Narration</Label>
                  <Input {...register('narration', { required: true })} />
                </div>
                <div className="space-y-1">
                  <Label>Entry Date</Label>
                  <Input type="date" {...register('entry_date', { required: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lines</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ account_id: '', debit: '0', credit: '0' })}>
                    <Plus className="h-3 w-3 mr-1" />Add Line
                  </Button>
                </div>
                <div className="grid grid-cols-[1fr_100px_100px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Account ID</span><span>Debit</span><span>Credit</span><span />
                </div>
                {fields.map((f, i) => (
                  <div key={f.id} className="grid grid-cols-[1fr_100px_100px_32px] gap-2 items-center">
                    <Input className="text-sm" placeholder="Account UUID" {...register(`lines.${i}.account_id`)} />
                    <Input className="text-sm font-mono" type="number" step="0.01" {...register(`lines.${i}.debit`)} />
                    <Input className="text-sm font-mono" type="number" step="0.01" {...register(`lines.${i}.credit`)} />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(i)} disabled={fields.length <= 2}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_100px_100px_32px] gap-2 pt-1 border-t text-sm font-semibold">
                  <span className="text-right pr-2">Totals</span>
                  <span className={`font-mono ${!balanced ? 'text-destructive' : 'text-green-600'}`}>{fmt(totalDebit)}</span>
                  <span className={`font-mono ${!balanced ? 'text-destructive' : 'text-green-600'}`}>{fmt(totalCredit)}</span>
                  <span />
                </div>
                {!balanced && <p className="text-xs text-destructive">Debits must equal credits</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isPending || !balanced}>
                {isPending ? <LoadingSpinner className="h-4 w-4" /> : 'Post Journal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference Type</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Total Debit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.journals?.length ? data.journals.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{fmtDate(j.entry_date)}</TableCell>
                  <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded">{j.reference_type}</span></TableCell>
                  <TableCell className="max-w-xs truncate">{j.narration}</TableCell>
                  <TableCell>{j.lines?.length ?? '-'}</TableCell>
                  <TableCell className="font-mono">${fmt(j.lines?.reduce((s, l) => s + Number(l.debit), 0))}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No journals found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination offset={offset} limit={LIMIT} hasMore={(data?.journals?.length ?? 0) === LIMIT} onChange={setOffset} />
        </CardContent>
      </Card>
    </div>
  );
}
