import { useState, useMemo } from 'react';

export type SortDir = 'asc' | 'desc';

/**
 * Generic client-side sort hook.
 *
 * Usage:
 *   const { sorted, sortKey, sortDir, toggle } = useSortable(rows, 'name');
 *   <th onClick={() => toggle('name')}>Name {sortIcon('name')}</th>
 */
export function useSortable<T extends Record<string, unknown>>(
  data: T[],
  defaultKey: keyof T,
  defaultDir: SortDir = 'asc',
) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const mult = sortDir === 'asc' ? 1 : -1;

      // nulls last
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;

      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * mult;
      }

      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mult;
    });
  }, [data, sortKey, sortDir]);

  const toggle = (key: keyof T) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** Returns 'asc' | 'desc' | null depending on whether this key is active */
  const dirFor = (key: keyof T): SortDir | null =>
    key === sortKey ? sortDir : null;

  return { sorted, sortKey, sortDir, toggle, dirFor };
}
