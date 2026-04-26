import { api } from './client';

export interface Trade {
  id: string; ticket: number; mt5_account_id: string; mt5_login?: number;
  symbol: string; direction: string; volume: number;
  open_price: number; close_price: number;
  profit: number; swap: number; commission: number; spread_income: number;
  book_type: string; journal_posted: boolean; close_time: string; created_at?: string;
  client_name?: string; client_code?: string;
}

export interface TradeDetail extends Trade {
  journals: {
    id: string; entry_date: string; reference_type: string; narration: string; status: string;
    lines: { account_code: string; account_name: string; debit: string; credit: string }[];
  }[];
  commissions: {
    id: string; ib_name?: string; ib_code?: string; ib_level?: string; amount: string; currency: string; status: string;
  }[];
}

export interface TradeTotals {
  volume: number; spread_income: number; b_book_pl: number; net_broker_pl: number;
}

export interface TradesQuery {
  ticket?: string; symbol?: string; book_type?: string; journal_posted?: boolean;
  start_date?: string; end_date?: string; limit?: number; offset?: number;
}

export const getTrades = (q: TradesQuery = {}) =>
  api.get<{ success: boolean; data: { trades: Trade[]; limit: number; offset: number; totals: TradeTotals } }>(
    '/trades', { params: q }
  ).then((r) => r.data.data);

export const getTrade = (id: string) =>
  api.get<{ success: boolean; data: TradeDetail }>(`/trades/${id}`).then((r) => r.data.data);
