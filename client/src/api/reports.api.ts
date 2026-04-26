import { api } from './client';

export interface PnLLine { account_id: string; account_code: string; account_name: string; balance: string; }
export interface PnLReport { revenue: PnLLine[]; expenses: PnLLine[]; totalRevenue: string; totalExpenses: string; netPnL: string; }

export interface BSLine { account_id: string; account_code: string; account_name: string; type: string; balance: string; }
export interface BalanceSheetReport { assets: BSLine[]; liabilities: BSLine[]; equity: BSLine[]; totalAssets: string; totalLiabilities: string; totalEquity: string; }

export interface LedgerEntry {
  id: string; entry_type: string; amount: string; currency: string;
  balance_after: string; narration?: string; created_at: string;
  mt5_login?: number; client_name?: string;
}

export interface ReconEntry {
  id: string; recon_date: string; status: string; notes?: string;
  resolved_by_name?: string; created_at: string;
}

export interface DateRangeQuery { start_date?: string; end_date?: string; }

export const getPnL = (q: DateRangeQuery) =>
  api.get<{ success: boolean; data: PnLReport }>('/reports/pnl', { params: q }).then((r) => r.data.data);

export const getBalanceSheet = (q: DateRangeQuery) =>
  api.get<{ success: boolean; data: BalanceSheetReport }>('/reports/balance-sheet', { params: q }).then((r) => r.data.data);

export const getClientLedger = (q: { mt5_account_id?: string; start_date?: string; end_date?: string; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: { entries: LedgerEntry[]; limit: number; offset: number } }>('/reports/client-ledger', { params: q }).then((r) => r.data.data);

export const getReconciliation = (q: DateRangeQuery) =>
  api.get<{ success: boolean; data: { records: ReconEntry[] } }>('/reports/reconciliation', { params: q }).then((r) => r.data.data);
