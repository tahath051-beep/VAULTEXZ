import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageHint } from '@/components/shared/PageHint';
import { useTranslation } from '@/lib/i18n/useTranslation';
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
  const { t } = useTranslation();
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
        title={t('eod.title')}
        subtitle={t('eod.subtitle')}
        hint={
          <PageHint id="eod" title={t('hint.eod.title')}>
            {t('hint.eod.body')}
          </PageHint>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard title={t('eod.triggerCard')} bodyClassName="space-y-4 p-6">
            <div className="space-y-1">
              <Label>{t('eod.date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} />
            </div>
            <Button className="w-full" onClick={() => trigger()} disabled={isPending || status?.status === 'LOCKED' || status?.status === 'RUNNING'}>
              {isPending ? <LoadingSpinner className="h-4 w-4 me-2" /> : <Play className="h-4 w-4 me-2" />}
              {status?.status === 'LOCKED' ? t('eod.alreadyLocked') : status?.status === 'RUNNING' ? t('eod.runningBtn') : t('eod.triggerBtn')}
            </Button>
            {status?.status === 'LOCKED' && (
              <p className="text-sm text-muted-foreground">{t('eod.lockedMsg')}</p>
            )}
        </SectionCard>

        <SectionCard title={t('eod.currentStatus')} bodyClassName="p-6">
            {status ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('eod.col.status')}</span>
                  <StatusBadge status={status.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('eod.col.records')}</span>
                  <span className="font-semibold">{status.records_processed ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('eod.col.lockedBy')}</span>
                  <span>{status.locked_by_name ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('eod.col.started')}</span>
                  <span className="text-sm">{fmtDateTime(status.created_at)}</span>
                </div>
                {status.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('eod.col.completed')}</span>
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
                    {t('eod.processing')}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('eod.noRecord', { date })}</p>
            )}
        </SectionCard>
      </div>
    </div>
  );
}
