import { HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  text: string;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ text, className, side = 'top' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const positionClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 me-1.5',
    right:  'left-full top-1/2 -translate-y-1/2 ms-1.5',
  }[side];

  return (
    <span
      ref={ref}
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help" />
      {open && (
        <span
          className={cn(
            'pointer-events-none absolute z-50 w-56 rounded-xl border border-border bg-popover px-3 py-2 text-[12px] leading-relaxed text-popover-foreground shadow-lg',
            positionClasses,
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}
