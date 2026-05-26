import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { useOpModuleStore } from '@/stores/opModule.store';
import { useToast } from '@/hooks/use-toast';

interface Props { requestId: string | null; onClose: () => void; }

export function RejectModal({ requestId, onClose }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { rejectRequest } = useOpModuleStore();
  const { toast } = useToast();
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!requestId || !reason.trim()) return;
    rejectRequest(requestId, user?.full_name ?? 'admin', reason.trim());
    toast({ title: t('opmod.toast.rejected') });
    setReason('');
    onClose();
  };

  return (
    <Dialog open={!!requestId} onOpenChange={() => { setReason(''); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('opmod.reject.title')}</DialogTitle>
          <DialogDescription>{requestId}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('opmod.reject.reason')} *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('opmod.reject.reasonPh')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setReason(''); onClose(); }}>{t('action.cancel')}</Button>
            <Button variant="destructive" size="sm" onClick={handleSubmit} disabled={!reason.trim()}>
              {t('opmod.action.reject')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
