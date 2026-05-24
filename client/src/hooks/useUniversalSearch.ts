import { useMemo } from 'react';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useOperationsStore } from '@/stores/operations.store';
import { useClientsStore } from '@/stores/clients.store';

export type SearchResultType = 'account' | 'client' | 'ib' | 'request' | 'voucher';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
}

export function useUniversalSearch(query: string) {
  const accounts = useWorkbookStore((s) => s.accounts);
  const { requests } = useOperationsStore();
  const { clients, ibs } = useClientsStore();

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const out: SearchResult[] = [];

    // Accounts
    accounts.filter((a) =>
      a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.arabic?.includes(q)
    ).slice(0, 4).forEach((a) => {
      out.push({
        id: `acc-${a.code}`,
        type: 'account',
        title: a.name,
        subtitle: a.arabic,
        href: '/data',
        meta: a.code,
      });
    });

    // Clients
    clients.filter((c) =>
      c.accountNo.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.arabic?.includes(q)
    ).slice(0, 3).forEach((c) => {
      out.push({
        id: `cl-${c.id}`,
        type: 'client',
        title: c.name,
        subtitle: c.arabic,
        href: '/clients',
        meta: c.accountNo,
      });
    });

    // IBs
    ibs.filter((ib) =>
      ib.name.toLowerCase().includes(q) || ib.mt5AccountNo.includes(q)
    ).slice(0, 2).forEach((ib) => {
      out.push({
        id: `ib-${ib.id}`,
        type: 'ib',
        title: ib.name,
        href: '/ib-mgmt',
        meta: ib.mt5AccountNo,
      });
    });

    // Requests
    requests.filter((r) => {
      const reqNo = `REQ-${String(r.requestNo).padStart(3, '0')}`;
      return reqNo.toLowerCase().includes(q)
        || r.lines.some((l) => l.accountNo.toLowerCase().includes(q))
        || (r.note ?? '').toLowerCase().includes(q);
    }).slice(0, 3).forEach((r) => {
      const reqNo = `REQ-${String(r.requestNo).padStart(3, '0')}`;
      out.push({
        id: `req-${r.id}`,
        type: 'request',
        title: reqNo,
        subtitle: r.note ?? r.type,
        href: '/operations',
        meta: r.status,
      });
    });

    // Vouchers
    requests.filter((r) => r.voucherRef && r.voucherRef.toLowerCase().includes(q))
      .slice(0, 2).forEach((r) => {
        out.push({
          id: `vch-${r.id}`,
          type: 'voucher',
          title: r.voucherRef!,
          subtitle: `${r.type} · ${r.date}`,
          href: '/vouchers',
          meta: `$${r.lines.reduce((s, l) => s + l.amount, 0).toLocaleString()}`,
        });
      });

    return out.slice(0, 12);
  }, [query, accounts, requests, clients, ibs]);

  return results;
}
