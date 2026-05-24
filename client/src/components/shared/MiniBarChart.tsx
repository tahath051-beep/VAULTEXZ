import { BarChart, Bar, Cell, XAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  height?: number;
  className?: string;
}

export function MiniBarChart({ data, highlightIndex, height = 180, className }: MiniBarChartProps) {
  const maxIdx =
    highlightIndex ??
    data.reduce((acc, d, i, arr) => (d.value > arr[acc].value ? i : acc), 0);

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={28}>
            {data.map((_, idx) => (
              <Cell
                key={idx}
                fill={idx === maxIdx ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
