import { CheckCircle, Clock, FileText, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/lib/workbook';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

const stepConfig: Record<TimelineEvent['action'], {
  icon: typeof CheckCircle;
  color: string;
  labelKey: TranslationKey;
}> = {
  created:   { icon: Clock,       color: 'text-muted-foreground bg-muted',         labelKey: 'req.timeline.created' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40',     labelKey: 'req.timeline.confirmed' },
  executed:  { icon: PlayCircle,  color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/40', labelKey: 'req.timeline.executed' },
  voucher:   { icon: FileText,    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40', labelKey: 'req.timeline.voucher' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface RequestTimelineProps {
  events: TimelineEvent[];
  compact?: boolean;
}

export function RequestTimeline({ events, compact }: RequestTimelineProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {events.map((ev, i) => {
          const cfg = stepConfig[ev.action];
          const Icon = cfg.icon;
          return (
            <div key={i} className="flex items-center gap-1">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>
                <Icon className="h-2.5 w-2.5" />
                {t(cfg.labelKey)}
              </span>
              {i < events.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((ev, i) => {
        const cfg = stepConfig[ev.action];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cfg.color)}>
                <Icon className="h-4 w-4" />
              </div>
              {i < events.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: '16px' }} />
              )}
            </div>
            <div className="pb-3 flex-1">
              <p className="text-sm font-semibold">{t(cfg.labelKey)}</p>
              <p className="text-xs text-muted-foreground">{ev.by}</p>
              <p className="text-xs text-muted-foreground">{formatTime(ev.at)}</p>
              {ev.note && <p className="mt-1 text-xs text-foreground/70 italic">{ev.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
