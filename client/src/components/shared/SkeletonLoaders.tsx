import { cn } from '@/lib/utils';

/* ── Base pulse block ────────────────────────────────────── */
function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/70',
        className,
      )}
      style={style}
    />
  );
}

/* ── Table skeleton ──────────────────────────────────────── */
export function TableSkeleton({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* header row */}
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className={cn('h-3.5 flex-1', i === 0 && 'max-w-[72px]')} />
        ))}
      </div>
      {/* data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            'flex gap-4 px-4 py-3.5',
            r % 2 === 0 ? 'bg-background' : 'bg-muted/10',
          )}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Bone
              key={c}
              className={cn(
                'h-3 flex-1',
                c === 0 && 'max-w-[72px]',
                c === cols - 1 && 'max-w-[64px]',
              )}
              style={{ opacity: 1 - r * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Stat card skeleton ──────────────────────────────────── */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-20" />
        <Bone className="h-9 w-9 rounded-xl" />
      </div>
      <Bone className="h-7 w-28" />
      <Bone className="h-2.5 w-16" />
    </div>
  );
}

/* ── Category card skeleton ──────────────────────────────── */
export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-20" />
        <Bone className="h-9 w-9 rounded-xl" />
      </div>
      <Bone className="h-8 w-32" />
      <div className="space-y-2 pt-1">
        <div className="flex justify-between">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-14" />
        </div>
        <div className="flex justify-between">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-14" />
        </div>
        <div className="flex justify-between">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/* ── Page-level skeleton (header + stat row + table) ─────── */
export function PageSkeleton({
  statCount = 4,
  showStats = true,
  tableCols = 5,
  tableRows = 6,
}: {
  statCount?: number;
  showStats?: boolean;
  tableCols?: number;
  tableRows?: number;
}) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-44" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-9 w-28 rounded-xl" />
      </div>

      {/* stat cards */}
      {showStats && (
        <div
          className={cn(
            'grid gap-4',
            statCount === 2 && 'grid-cols-2',
            statCount === 3 && 'grid-cols-3',
            statCount === 4 && 'grid-cols-2 lg:grid-cols-4',
          )}
        >
          {Array.from({ length: statCount }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* filter bar */}
      <div className="flex gap-3">
        <Bone className="h-9 w-32 rounded-xl" />
        <Bone className="h-9 w-32 rounded-xl" />
        <Bone className="h-9 w-32 rounded-xl" />
      </div>

      {/* table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <TableSkeleton rows={tableRows} cols={tableCols} />
      </div>
    </div>
  );
}

/* ── Dashboard-specific skeleton ─────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-52" />
          <Bone className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-40 rounded-xl" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      {/* hero banner */}
      <Bone className="h-32 w-full rounded-2xl" />
      {/* category cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </div>
      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Bone className="h-48 rounded-2xl lg:col-span-2" />
        <Bone className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
