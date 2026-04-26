import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { fmt, fmtDate } from '@/lib/utils';
import { api } from '@/api/client';
import { DollarSign, GitBranch, ChevronRight } from 'lucide-react';

interface IBCommission {
  id: string;
  ib_client_id: string;
  ib_name?: string;
  ib_code?: string;
  ib_level?: string;
  trade_id?: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

interface IBSummary {
  ib_client_id: string;
  ib_name: string;
  ib_code: string;
  ib_level?: string;
  parent_ib_id?: string | null;
  parent_ib_name?: string | null;
  sub_ib_count?: number;
  total_pending: string;
  total_paid: string;
}

const getCommissions = (q: { status?: string; limit: number; offset: number }) =>
  api.get<{ success: boolean; data: { commissions: IBCommission[]; limit: number; offset: number } }>(
    '/ib-commissions', { params: q }
  ).then((r) => r.data.data);

const getSummary = () =>
  api.get<{ success: boolean; data: { summary: IBSummary[] } }>(
    '/ib-commissions/summary'
  ).then((r) => r.data.data);

const payout = (ibId: string) =>
  api.post<{ success: boolean; data: { journalId: string; totalPaid: string } }>(
    `/ib-commissions/${ibId}/payout`
  ).then((r) => r.data.data);

const LIMIT = 20;

const levelColors: Record<string, string> = {
  L1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  L2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  L3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const levelIndentClass: Record<string, string> = {
  L1: 'ml-0',
  L2: 'ml-8',
  L3: 'ml-16',
};

export default function IBCommissions() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['ib-commissions', offset, statusFilter],
    queryFn: () => getCommissions({ limit: LIMIT, offset, status: statusFilter === 'ALL' ? undefined : statusFilter }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['ib-summary'],
    queryFn: getSummary,
  });

  const { mutate: doPayout, isPending: paying } = useMutation({
    mutationFn: payout,
    onSuccess: (d) => {
      toast({ title: 'Payout processed', description: `Total paid: $${fmt(d.totalPaid)}` });
      qc.invalidateQueries({ queryKey: ['ib-commissions'] });
      qc.invalidateQueries({ queryKey: ['ib-summary'] });
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Payout failed', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  const summaryList = summaryData?.summary ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IB Commissions</h1>
        <p className="text-muted-foreground">Introducing broker commission tracking and payouts</p>
      </div>

      {/* IB Hierarchy Tree */}
      {summaryList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">IB Hierarchy</h2>
          </div>
          <div className="space-y-2">
            {summaryList.map((s) => {
              const level = s.ib_level ?? 'L1';
              return (
                <div key={s.ib_client_id} className={levelIndentClass[level] ?? 'ml-0'}>
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {(level === 'L2' || level === 'L3') && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{s.ib_name}</p>
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${levelColors[level] ?? 'bg-muted'}`}>
                                {level}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-xs text-muted-foreground font-mono">{s.ib_code}</p>
                              {s.parent_ib_name && (
                                <p className="text-xs text-muted-foreground">↳ via {s.parent_ib_name}</p>
                              )}
                              {s.sub_ib_count != null && s.sub_ib_count > 0 && (
                                <p className="text-xs text-muted-foreground">· {s.sub_ib_count} sub-IB{s.sub_ib_count > 1 ? 's' : ''}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-yellow-600">${fmt(s.total_pending)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-semibold text-green-600">${fmt(s.total_paid)}</span>
                      </div>
                      {Number(s.total_pending) > 0 && (
                        <Button
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => doPayout(s.ib_client_id)}
                          disabled={paying}
                        >
                          {paying && <LoadingSpinner className="h-3 w-3 mr-1" />}
                          Pay Out ${fmt(s.total_pending)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commission Detail Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IB Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.commissions?.length ? data.commissions.map((c) => {
                const lv = c.ib_level ?? 'L1';
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.ib_name ?? '—'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{c.ib_code ?? '—'}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${levelColors[lv] ?? 'bg-muted'}`}>
                        {lv}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${fmt(c.amount)}{' '}
                      <span className="text-xs text-muted-foreground">{c.currency}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm">{fmtDate(c.created_at)}</TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No commissions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            offset={offset}
            limit={LIMIT}
            hasMore={(data?.commissions?.length ?? 0) === LIMIT}
            onChange={setOffset}
          />
        </CardContent>
      </Card>
    </div>
  );
}
