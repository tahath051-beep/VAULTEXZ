import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Inbox, Users, GitBranch, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface FABAction {
  icon: typeof Plus;
  label: string;
  href?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionFABProps {
  onNewRequest?: () => void;
}

export function QuickActionFAB({ onNewRequest }: QuickActionFABProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: FABAction[] = [
    {
      icon: Inbox,
      label: t('ops.requests.new'),
      color: 'bg-primary text-primary-foreground',
      onClick: () => { onNewRequest?.(); setOpen(false); navigate('/operations'); },
    },
    {
      icon: Users,
      label: t('clients.add'),
      color: 'bg-emerald-500 text-white',
      onClick: () => { setOpen(false); navigate('/clients'); },
    },
    {
      icon: GitBranch,
      label: t('ib.mgmt.add'),
      color: 'bg-violet-500 text-white',
      onClick: () => { setOpen(false); navigate('/ib-mgmt'); },
    },
    {
      icon: DollarSign,
      label: t('currency.addRate'),
      color: 'bg-amber-500 text-white',
      onClick: () => { setOpen(false); navigate('/currency'); },
    },
  ];

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col-reverse items-end gap-3">
      {/* Action items */}
      {open && actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-medium shadow-md whitespace-nowrap">
              {action.label}
            </span>
            <button
              onClick={action.onClick ?? (() => { action.href && navigate(action.href); setOpen(false); })}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110',
                action.color,
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {/* Main FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200',
          'gradient-bg text-white hover:scale-110 hover:shadow-glow',
          open && 'rotate-45',
        )}
        aria-label="Quick actions"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
