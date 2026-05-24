import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AIInsight {
  title: string;
  body: string;
}

interface AIInsightsCardProps {
  insights: AIInsight[];
  className?: string;
}

export function AIInsightsCard({ insights, className }: AIInsightsCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'card-elevated relative overflow-hidden p-5',
        className,
      )}
    >
      {/* Decorative orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-90 animate-float"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsl(222 91% 75%), hsl(222 84% 56%) 45%, hsl(262 84% 48%) 100%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/40 mix-blend-overlay"
      />

      <div className="relative flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('ai.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('ai.updatedNow')}</p>
        </div>
      </div>

      <ul className="relative mt-4 space-y-3">
        {insights.length === 0 && (
          <li className="text-sm text-muted-foreground">{t('ai.noInsights')}</li>
        )}
        {insights.map((ins, i) => (
          <li key={i} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-3">
            <p className="text-sm font-medium text-foreground">{ins.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{ins.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
