import axios from 'axios';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import type { ClientUser } from '@/stores/clientAuth.store';

export const clientApi = axios.create({ baseURL: '/api/v1', timeout: 30000 });

clientApi.interceptors.request.use((config) => {
  const token = useClientAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

clientApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useClientAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const clientLogin = (email: string, password: string) =>
  clientApi.post<{ success: boolean; data: { token: string; user: ClientUser } }>(
    '/client/auth/login', { email, password }
  ).then((r) => r.data.data);

// ── Profile ─────────────────────────────────────────────────────────────────
export const getClientProfile = () =>
  clientApi.get<{ success: boolean; data: ClientUser }>('/client/me').then((r) => r.data.data);

export const changeClientPassword = (d: { current_password: string; new_password: string }) =>
  clientApi.post<{ success: boolean; data: { message: string } }>('/client/me/change-password', d)
    .then((r) => r.data.data);

// ── Accounts ─────────────────────────────────────────────────────────────────
export interface ClientAccount {
  id: string;
  mt5_login: number;
  account_type: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
}

export const getClientAccounts = () =>
  clientApi.get<{ success: boolean; data: { accounts: ClientAccount[] } }>('/client/accounts')
    .then((r) => r.data.data.accounts);

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface ClientTrade {
  id: string;
  ticket: number;
  mt5_login: number;
  symbol: string;
  direction: string;
  volume: number;
  open_price: number;
  close_price: number;
  profit: number;
  swap: number;
  commission: number;
  close_time: string;
}

export interface ClientTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  amount_usd: number;
  status: string;
  gateway: string;
  reference: string;
  mt5_login: number;
  date: string;
  narration: string;
}

export interface ClientDashboard {
  metrics: {
    total_balance: number;
    total_deposits: number;
    total_withdrawals: number;
    realized_pnl: number;
  };
  recent_transactions: ClientTransaction[];
  recent_trades: ClientTrade[];
}

export const getClientDashboard = () =>
  clientApi.get<{ success: boolean; data: ClientDashboard }>('/client/dashboard')
    .then((r) => r.data.data);

// ── Trades ───────────────────────────────────────────────────────────────────
export interface ClientTradesQuery {
  mt5_login?: number;
  symbol?: string;
  direction?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export const getClientTrades = (q: ClientTradesQuery) =>
  clientApi.get<{ success: boolean; data: { trades: ClientTrade[]; total: number } }>(
    '/client/trades', { params: q }
  ).then((r) => r.data.data);

// ── Transactions ─────────────────────────────────────────────────────────────
export const getClientTransactions = (q: { type?: string; mt5_login?: number; limit?: number; offset?: number }) =>
  clientApi.get<{ success: boolean; data: { transactions: ClientTransaction[] } }>(
    '/client/transactions', { params: q }
  ).then((r) => r.data.data.transactions);

export const requestWithdrawal = (d: { mt5_account_id: string; amount: number; gateway: string; details: string }) =>
  clientApi.post<{ success: boolean; data: ClientTransaction }>('/client/transactions/withdraw', d)
    .then((r) => r.data.data);

export const requestDeposit = (d: { mt5_account_id: string; amount: number; gateway: string; reference: string }) =>
  clientApi.post<{ success: boolean; data: ClientTransaction }>('/client/transactions/deposit', d)
    .then((r) => r.data.data);

// ── Statements ───────────────────────────────────────────────────────────────
export interface ClientStatement {
  account: ClientAccount;
  period: { start: string; end: string };
  opening_balance: number;
  closing_balance: number;
  transactions: ClientTransaction[];
  trades: ClientTrade[];
  trade_count: number;
  total_pnl: number;
}

export const getClientStatement = (mt5_login: number, start: string, end: string) =>
  clientApi.get<{ success: boolean; data: ClientStatement }>(
    '/client/statement', { params: { mt5_login, start, end } }
  ).then((r) => r.data.data);
