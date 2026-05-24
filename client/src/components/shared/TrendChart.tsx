import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface TrendPoint {
  label: string;
  value: number;
  compare?: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
  formatValue?: (n: number) => string;
  className?: string;
  showCompare?: boolean;
}

const defaultFormat = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export function TrendChart({
  data,
  height = 240,
  formatValue = defaultFormat,
  className,
  showCompare,
}: TrendChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trend-fill-compare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.12} />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => formatValue(v as number)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 12,
              boxShadow: '0 8px 24px -6px rgba(15,23,42,0.12)',
              padding: '8px 12px',
              fontSize: 12,
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500, marginBottom: 4 }}
            formatter={(v) => formatValue(v as number)}
          />
          {showCompare && (
            <Area
              type="monotone"
              dataKey="compare"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#trend-fill-compare)"
              dot={false}
              isAnimationActive
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#trend-fill)"
            dot={false}
            activeDot={{ r: 4, stroke: 'hsl(var(--card))', strokeWidth: 2, fill: 'hsl(var(--primary))' }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
