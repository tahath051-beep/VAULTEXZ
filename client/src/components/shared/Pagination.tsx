import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  offset: number;
  limit: number;
  total?: number;
  hasMore?: boolean;
  onChange: (offset: number) => void;
}

export function Pagination({ offset, limit, total, hasMore, onChange }: Props) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = total ? Math.ceil(total / limit) : undefined;
  const canPrev = offset > 0;
  const canNext = hasMore ?? (totalPages ? page < totalPages : false);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        {total != null
          ? `Showing ${offset + 1}–${Math.min(offset + limit, total)} of ${total}`
          : `Page ${page}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => onChange(offset - limit)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onChange(offset + limit)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
