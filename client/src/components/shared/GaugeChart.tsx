import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  target?: number;
  label?: string;
  height?: number;
  className?: string;
}

export function GaugeChart({
  value,
  target = 100,
  label,
  height = 180,
  className,
}: GaugeChartProps) {
  const pct = Math.max(0, Math.min(100, (value / target) * 100));
  const filled = pct;
  const empty = 100 - pct;

  const data = [
    { name: 'filled', value: filled },
    { name: 'empty', value: empty },
  ];

  return (
    <div className={cn('relative flex flex-col items-center justify-center', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            isAnimationActive
          >
            <Cell fill="url(#gauge-grad)" />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight text-foreground">{Math.round(pct)}%</span>
        {label && <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
