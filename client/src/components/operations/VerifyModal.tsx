import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { useOpModuleStore, MOCK_ACCOUNTS, type OpRequest } from '@/stores/opModule.store';
import { useToast } from '@/hooks/use-toast';

interface Props { request: OpRequest | null; onClose: () => void; }

export function VerifyModal({ request, onClose }: Props) {
  const { t, lang } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { advanceStage } = useOpModuleStore();
  const { toast } = useToast();
  const [verifiedAccountId, setVerifiedAccountId] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!request) return;
    advanceStage(request.id, user?.full_name ?? 'admin', notes || undefined, verifiedAccountId || undefined);
    toast({ title: t('opmod.toast.advanced') });
    setVerifiedAccountId('');
    setNotes('');
    onClose();
  };

  const prefilledAccount = request?.lines[0]?.account_id ?? '';

  return (
    <Dialog open={!!request} onOpenChange={() => { setVerifiedAccountId(''); setNotes(''); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('opmod.verify.title')}</DialogTitle>
          <DialogDescription className="font-mono">{request?.request_number}</DialogDescription>
        </DialogHeader>
        {request && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground text-xs mb-1">Amount confirmed</p>
              <p className="font-mono font-bold text-primary text-lg">${request.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">{t('opmod.verify.account')}</label>
              <div className="relative">
                <select
                  value={verifiedAccountId || prefilledAccount}
                  onChange={(e) => setVerifiedAccountId(e.target.value)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pe-8 text-sm"
                >
                  {MOCK_ACCOUNTS.filter((a) => !a.id.startsWith('mt5-')).map((a) => (
                    <option key={a.id} value={a.id}>[{a.code}] {lang === 'ar' ? a.name_ar : a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">{t('opmod.verify.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>{t('action.cancel')}</Button>
              <Button variant="gradient" size="sm" onClick={handleConfirm}>{t('opmod.action.confirmReceipt')}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
