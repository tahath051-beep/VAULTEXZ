import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/client';
import { X, Plus } from 'lucide-react';

interface GeneralSettings {
  broker_name: string;
  timezone: string;
  mt5_server: string;
  withdrawal_approval_steps: number;
  reconciliation_threshold: string;
  eod_schedule_time: string;
  report_delivery_emails: string[];
}

const getGeneral = () =>
  api.get<{ success: boolean; data: GeneralSettings }>('/settings/general').then((r) => r.data.data);

const saveGeneral = (data: GeneralSettings) =>
  api.patch<{ success: boolean; data: GeneralSettings }>('/settings/general', data).then((r) => r.data.data);

const TIMEZONES = ['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Europe/Frankfurt', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo'];

export default function GeneralSettings() {
  const qc = useQueryClient();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [approvalSteps, setApprovalSteps] = useState('1');
  const [timezone, setTimezone] = useState('UTC');

  const { data, isLoading } = useQuery({ queryKey: ['settings-general'], queryFn: getGeneral });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GeneralSettings>();

  useEffect(() => {
    if (data) {
      reset(data);
      setEmails(data.report_delivery_emails ?? []);
      setApprovalSteps(String(data.withdrawal_approval_steps ?? 1));
      setTimezone(data.timezone ?? 'UTC');
    }
  }, [data, reset]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: saveGeneral,
    onSuccess: () => {
      toast({ title: 'Settings saved' });
      qc.invalidateQueries({ queryKey: ['settings-general'] });
    },
    onError: () => toast({ title: 'Failed to save settings', variant: 'destructive' }),
  });

  const onSubmit = (d: GeneralSettings) => {
    save({ ...d, timezone, withdrawal_approval_steps: Number(approvalSteps), report_delivery_emails: emails });
  };

  const addEmail = () => {
    const e = newEmail.trim();
    if (!e || !e.includes('@') || emails.includes(e)) return;
    setEmails([...emails, e]);
    setNewEmail('');
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6 max-w-2xl">

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Broker Info</p>
            <div className="space-y-1">
              <Label>Broker Name <span className="text-destructive">*</span></Label>
              <Input {...register('broker_name', { required: true })} />
              {errors.broker_name && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">MT5 Configuration</p>
            <div className="space-y-1">
              <Label>MT5 Server Address</Label>
              <Input placeholder="host:port" {...register('mt5_server')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Operations</p>
            <div className="space-y-1">
              <Label>Withdrawal Approval Steps</Label>
              <Select value={approvalSteps} onValueChange={setApprovalSteps}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1-Step (Auto-approve)</SelectItem>
                  <SelectItem value="2">2-Step (Requires review)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Reconciliation Threshold ($)</Label>
              <Input type="number" step="0.001" className="w-48" {...register('reconciliation_threshold')} />
              <p className="text-xs text-muted-foreground">Differences below this amount are ignored</p>
            </div>
            <div className="space-y-1">
              <Label>EOD Schedule Time (UTC)</Label>
              <Input type="time" className="w-36" {...register('eod_schedule_time')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Report Delivery Emails</p>
            <div className="space-y-2">
              {emails.map((e) => (
                <div key={e} className="flex items-center gap-2">
                  <span className="text-sm flex-1 font-mono">{e}</span>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => setEmails(emails.filter((x) => x !== e))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addEmail}>
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving && <LoadingSpinner className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
