import { cn } from '@/lib/utils';

type MoneySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface MoneyCellProps {
  value: number | string | null | undefined;
  currency?: string;
  signColor?: boolean;
  className?: string;
  small?: boolean;
  bold?: boolean;
  size?: MoneySize;
}

const sizeMap: Record<MoneySize, string> = {
  xs: 'text-[11px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base font-semibold',
  xl: 'text-xl font-bold',
};

const fmtMoney = (n: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};

export function MoneyCell({
  value,
  currency = 'USD',
  signColor = true,
  className,
  small,
  bold,
  size = 'md',
}: MoneyCellProps) {
  const num  = value == null ? 0 : Number(value);
  const safe = Number.isFinite(num) ? num : 0;

  const colorClass = !signColor
    ? 'text-foreground'
    : safe > 0  ? 'text-success'
    : safe < 0  ? 'text-destructive'
    : 'text-muted-foreground/60';

  const resolvedSize = small ? 'text-xs' : sizeMap[size];

  return (
    <span className={cn(
      'tabular-nums font-mono tracking-tight',
      colorClass,
      resolvedSize,
      bold && 'font-semibold',
      className,
    )}>
      {fmtMoney(safe, currency)}
    </span>
  );
}
