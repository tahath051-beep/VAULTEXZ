import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const DefaultIllustration = () => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    className="h-16 w-16"
    aria-hidden
  >
    <rect x="8" y="16" width="64" height="48" rx="6" className="fill-muted stroke-border" strokeWidth="2" />
    <rect x="16" y="26" width="28" height="4" rx="2" className="fill-muted-foreground/25" />
    <rect x="16" y="34" width="48" height="3" rx="1.5" className="fill-muted-foreground/15" />
    <rect x="16" y="41" width="40" height="3" rx="1.5" className="fill-muted-foreground/15" />
    <rect x="16" y="48" width="44" height="3" rx="1.5" className="fill-muted-foreground/15" />
    <circle cx="56" cy="28" r="8" className="fill-card stroke-border" strokeWidth="2" />
    <path d="M53 28h6M56 25v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/40" />
  </svg>
);

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/60">
        {icon ?? <DefaultIllustration />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Preset empty states for common pages */
export function EmptyClients({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.clients')}
      description={t('empty.clients.sub')}
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            + {t('clients.add')}
          </button>
        )
      }
    />
  );
}

export function EmptyTrades() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.trades')}
      description={t('empty.trades.sub')}
    />
  );
}

export function EmptyJournals({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.journals')}
      description={t('empty.journals.sub')}
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            + {t('journals.new')}
          </button>
        )
      }
    />
  );
}

export function EmptyPayments() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.payments')}
      description={t('empty.payments.sub')}
    />
  );
}

export function EmptyOperations({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.operations')}
      description={t('empty.operations.sub')}
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            + {t('ops.requests.new')}
          </button>
        )
      }
    />
  );
}

export function EmptySearch({ query: _query }: { query?: string }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('empty.search')}
      description={t('empty.search.sub')}
    />
  );
}
