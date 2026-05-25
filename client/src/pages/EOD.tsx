import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { SectionCard } from '@/components/shared/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { triggerEOD, getEODStatus } from '@/api/eod.api';
import { toast } from '@/hooks/use-toast';
import { fmtDateTime } from '@/lib/utils';
import { format } from 'date-fns';
import { Play } from 'lucide-react';

const today = format(new Date(), 'yyyy-MM-dd');

export default function EOD() {
  const [date, setDate] = useState(today);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['eod-status', date],
    queryFn: () => getEODStatus(date),
    retry: false,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'RUNNING' ? 5000 : false;
    },
  });

  const { mutate: trigger, isPending } = useMutation({
    mutationFn: () => triggerEOD(date),
    onSuccess: (d) => {
      toast({ title: 'EOD triggered', description: `Job ID: ${d.jobId}` });
      setTimeout(() => refetch(), 2000);
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({ title: 'Error', description: e?.response?.data?.error ?? 'Failed to trigger EOD', variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;

  const statusColors: Record<string, string> = {
    COMPLETED: 'text-green-600',
    FAILED: 'text-destructive',
    RUNNING: 'text-yellow-600',
    LOCKED: 'text-blue-600',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="EOD Processing"
        subtitle="End of Day — close the trading session and lock today's records"
        hint={
          <PageHint id="eod" title="What is this page?">
            EOD (End of Day) is a daily closing process. When you run EOD, it calculates the day's totals, generates any required journal entries, and locks the day so nothing can be backdated. Think of it like "closing the register" at the end of a business day.
          </PageHint>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard title="Trigger EOD" bodyClassName="space-y-4 p-6">
            <div className="space-y-1">
              <Label>EOD Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} />
            </div>
            <Button className="w-full" onClick={() => trigger()} disabled={isPending || status?.status === 'LOCKED' || status?.status === 'RUNNING'}>
              {isPending ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {status?.status === 'LOCKED' ? 'Already Locked' : status?.status === 'RUNNING' ? 'Running...' : 'Trigger EOD'}
            </Button>
            {status?.status === 'LOCKED' && (
              <p className="text-sm text-muted-foreground">This date has been locked and cannot be re-processed.</p>
            )}
        </SectionCard>

        <SectionCard title="Current Status" bodyClassName="p-6">
            {status ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={status.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Records Processed</span>
                  <span className="font-semibold">{status.records_processed ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Locked By</span>
                  <span>{status.locked_by_name ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm">{fmtDateTime(status.created_at)}</span>
                </div>
                {status.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm">{fmtDateTime(status.completed_at)}</span>
                  </div>
                )}
                {status.error_message && (
                  <div className="mt-3 p-3 rounded bg-destructive/10 text-destructive text-sm">
                    {status.error_message}
                  </div>
                )}
                {status.status === 'RUNNING' && (
                  <div className={`text-center font-medium animate-pulse ${statusColors['RUNNING']}`}>
                    Processing...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No EOD record for {date}.</p>
            )}
        </SectionCard>
      </div>
    </div>
  );
}
