import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/client';
import { Settings2, Building2, Bitcoin, MoreHorizontal } from 'lucide-react';

interface Gateway {
  id: string; name: string; type: string; is_active: boolean;
  min_deposit: string; max_deposit: string; min_withdrawal: string; max_withdrawal: string;
}

type GatewayForm = Pick<Gateway, 'min_deposit' | 'max_deposit' | 'min_withdrawal' | 'max_withdrawal' | 'is_active'>;

const getGateways = () =>
  api.get<{ success: boolean; data: { gateways: Gateway[] } }>('/settings/gateways').then((r) => r.data.data.gateways);

const updateGateway = ({ id, ...data }: Partial<Gateway> & { id: string }) =>
  api.patch<{ success: boolean; data: Gateway }>(`/settings/gateways/${id}`, data).then((r) => r.data.data);

const gwIcon = (type: string) => {
  if (type === 'MANUAL')    return <Settings2 className="h-5 w-5" />;
  if (type === 'BANK_WIRE') return <Building2 className="h-5 w-5" />;
  if (type === 'CRYPTO')    return <Bitcoin className="h-5 w-5" />;
  return <MoreHorizontal className="h-5 w-5" />;
};

const typeColors: Record<string, string> = {
  MANUAL:    'bg-blue-50 dark:bg-blue-950',
  BANK_WIRE: 'bg-green-50 dark:bg-green-950',
  CRYPTO:    'bg-orange-50 dark:bg-orange-950',
  OTHER:     'bg-gray-50 dark:bg-gray-900',
};

const fmt = (v: string) => Number(v).toLocaleString('en-US');

export default function GatewaySettings() {
  const qc = useQueryClient();
  const [configTarget, setConfigTarget] = useState<Gateway | null>(null);

  const { data: gateways = [], isLoading } = useQuery({ queryKey: ['settings-gateways'], queryFn: getGateways });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: updateGateway,
    onSuccess: () => {
      toast({ title: 'Gateway updated' });
      qc.invalidateQueries({ queryKey: ['settings-gateways'] });
      setConfigTarget(null);
    },
    onError: () => toast({ title: 'Failed to update gateway', variant: 'destructive' }),
  });

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gateways.map((gw) => (
          <Card key={gw.id} className={!gw.is_active ? 'opacity-60' : undefined}>
            <CardHeader className={`pb-3 pt-4 px-4 rounded-t-lg ${typeColors[gw.type] ?? ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{gwIcon(gw.type)}</span>
                  <div>
                    <p className="font-semibold text-sm">{gw.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{gw.type}</p>
                  </div>
                </div>
                <Badge variant={gw.is_active ? 'success' : 'secondary'} className="text-xs">
                  {gw.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3 pb-4 px-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Min Deposit</p>
                  <p className="font-mono font-medium">${fmt(gw.min_deposit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Deposit</p>
                  <p className="font-mono font-medium">${fmt(gw.max_deposit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Withdrawal</p>
                  <p className="font-mono font-medium">${fmt(gw.min_withdrawal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Withdrawal</p>
                  <p className="font-mono font-medium">${fmt(gw.max_withdrawal)}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => setConfigTarget(gw)}>
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configure Dialog */}
      {configTarget && (
        <Dialog open={!!configTarget} onOpenChange={(open) => { if (!open) setConfigTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {gwIcon(configTarget.type)}
                Configure {configTarget.name}
              </DialogTitle>
            </DialogHeader>
            <ConfigForm
              gateway={configTarget}
              onSave={(d) => update({ id: configTarget.id, ...d })}
              saving={updating}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ConfigForm({ gateway, onSave, saving }: {
  gateway: Gateway;
  onSave: (d: Partial<GatewayForm>) => void;
  saving: boolean;
}) {
  const { register, handleSubmit } = useForm<GatewayForm>({ defaultValues: gateway as unknown as GatewayForm });
  const [isActive, setIsActive] = useState(String(gateway.is_active));

  return (
    <form onSubmit={handleSubmit((d) => onSave({ ...d, is_active: isActive === 'true' }))} className="space-y-4">
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Min Deposit ($)</Label>
          <Input type="number" step="1" {...register('min_deposit')} />
        </div>
        <div className="space-y-1">
          <Label>Max Deposit ($)</Label>
          <Input type="number" step="1" {...register('max_deposit')} />
        </div>
        <div className="space-y-1">
          <Label>Min Withdrawal ($)</Label>
          <Input type="number" step="1" {...register('min_withdrawal')} />
        </div>
        <div className="space-y-1">
          <Label>Max Withdrawal ($)</Label>
          <Input type="number" step="1" {...register('max_withdrawal')} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <LoadingSpinner className="h-4 w-4 mr-2" />}
        Save Gateway
      </Button>
    </form>
  );
}
