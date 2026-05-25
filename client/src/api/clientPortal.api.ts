import axios from 'axios';
import { useClientAuthStore } from '@/stores/clientAuth.store';
import type { ClientUser } from '@/stores/clientAuth.store';
import {
  MOCK_CLIENT_TOKEN, MOCK_CLIENT_USER,
  mockClientAccounts, mockClientTrades, mockClientTransactions,
} from '@/mocks/data/clientPortal.mock';

const DEMO_EMAIL    = 'client@demo.com';
const DEMO_PASSWORD = 'Demo@123456';

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
export const clientLogin = (email: string, password: string) => {
  if (import.meta.env.PROD) {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return Promise.resolve({ token: MOCK_CLIENT_TOKEN, user: MOCK_CLIENT_USER });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }
  return clientApi
    .post<{ success: boolean; data: { token: string; user: ClientUser } }>(
      '/client/auth/login', { email, password }
    )
    .then((r) => r.data.data);
};

// ── Profile ─────────────────────────────────────────────────────────────────
export const getClientProfile = () => {
  if (import.meta.env.PROD) return Promise.resolve(MOCK_CLIENT_USER);
  return clientApi
    .get<{ success: boolean; data: ClientUser }>('/client/me')
    .then((r) => r.data.data);
};

export const changeClientPassword = (d: { current_password: string; new_password: string }) => {
  if (import.meta.env.PROD) return Promise.resolve({ message: 'Password changed (demo mode)' });
  return clientApi
    .post<{ success: boolean; data: { message: string } }>('/client/me/change-password', d)
    .then((r) => r.data.data);
};

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

export const getClientAccounts = () => {
  if (import.meta.env.PROD) return Promise.resolve(mockClientAccounts);
  return clientApi
    .get<{ success: boolean; data: { accounts: ClientAccount[] } }>('/client/accounts')
    .then((r) => r.data.data.accounts);
};

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

export const getClientDashboard = () => {
  if (import.meta.env.PROD) {
    const mockDashboard: ClientDashboard = {
      metrics: {
        total_balance: mockClientAccounts.reduce((s, a) => s + a.balance, 0),
        total_deposits: mockClientTransactions
          .filter((t) => t.type === 'DEPOSIT' && t.status === 'APPROVED')
          .reduce((s, t) => s + t.amount, 0),
        total_withdrawals: mockClientTransactions
          .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'APPROVED')
          .reduce((s, t) => s + t.amount, 0),
        realized_pnl: mockClientTrades.reduce((s, t) => s + t.profit, 0),
      },
      recent_transactions: mockClientTransactions.slice(0, 5),
      recent_trades: mockClientTrades.slice(0, 5),
    };
    return Promise.resolve(mockDashboard);
  }
  return clientApi
    .get<{ success: boolean; data: ClientDashboard }>('/client/dashboard')
    .then((r) => r.data.data);
};

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

export const getClientTrades = (q: ClientTradesQuery) => {
  if (import.meta.env.PROD) {
    let trades = [...mockClientTrades];
    if (q.mt5_login) trades = trades.filter((t) => t.mt5_login === q.mt5_login);
    if (q.symbol)    trades = trades.filter((t) => t.symbol === q.symbol);
    if (q.direction) trades = trades.filter((t) => t.direction === q.direction);
    const offset = q.offset ?? 0;
    const limit  = q.limit  ?? 100;
    return Promise.resolve({ trades: trades.slice(offset, offset + limit), total: trades.length });
  }
  return clientApi
    .get<{ success: boolean; data: { trades: ClientTrade[]; total: number } }>(
      '/client/trades', { params: q }
    )
    .then((r) => r.data.data);
};

// ── Transactions ─────────────────────────────────────────────────────────────
export const getClientTransactions = (
  q: { type?: string; mt5_login?: number; limit?: number; offset?: number },
) => {
  if (import.meta.env.PROD) {
    let txns = [...mockClientTransactions];
    if (q.type)      txns = txns.filter((t) => t.type === q.type);
    if (q.mt5_login) txns = txns.filter((t) => t.mt5_login === q.mt5_login);
    const offset = q.offset ?? 0;
    const limit  = q.limit  ?? 100;
    return Promise.resolve(txns.slice(offset, offset + limit));
  }
  return clientApi
    .get<{ success: boolean; data: { transactions: ClientTransaction[] } }>(
      '/client/transactions', { params: q }
    )
    .then((r) => r.data.data.transactions);
};

export const requestWithdrawal = (
  d: { mt5_account_id: string; amount: number; gateway: string; details: string },
) => {
  if (import.meta.env.PROD) {
    const mockTxn: ClientTransaction = {
      id: `wdr-demo-${Date.now()}`,
      type: 'WITHDRAWAL',
      amount: d.amount,
      currency: 'USD',
      amount_usd: d.amount,
      status: 'PENDING',
      gateway: d.gateway,
      reference: `WD-DEMO-${Date.now()}`,
      mt5_login: mockClientAccounts[0].mt5_login,
      date: new Date().toISOString(),
      narration: d.details || 'Withdrawal request',
    };
    return Promise.resolve(mockTxn);
  }
  return clientApi
    .post<{ success: boolean; data: ClientTransaction }>(
      '/client/transactions/withdraw', d
    )
    .then((r) => r.data.data);
};

export const requestDeposit = (
  d: { mt5_account_id: string; amount: number; gateway: string; reference: string },
) => {
  if (import.meta.env.PROD) {
    const mockTxn: ClientTransaction = {
      id: `dep-demo-${Date.now()}`,
      type: 'DEPOSIT',
      amount: d.amount,
      currency: 'USD',
      amount_usd: d.amount,
      status: 'PENDING',
      gateway: d.gateway,
      reference: d.reference || `DEP-DEMO-${Date.now()}`,
      mt5_login: mockClientAccounts[0].mt5_login,
      date: new Date().toISOString(),
      narration: 'Deposit request',
    };
    return Promise.resolve(mockTxn);
  }
  return clientApi
    .post<{ success: boolean; data: ClientTransaction }>(
      '/client/transactions/deposit', d
    )
    .then((r) => r.data.data);
};

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

export const getClientStatement = (mt5_login: number, start: string, end: string) => {
  if (import.meta.env.PROD) {
    const account = mockClientAccounts.find((a) => a.mt5_login === mt5_login) ?? mockClientAccounts[0];
    const trades  = mockClientTrades.filter((t) => t.mt5_login === account.mt5_login);
    const txns    = mockClientTransactions.filter((t) => t.mt5_login === account.mt5_login);
    const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
    const mockStmt: ClientStatement = {
      account,
      period: { start, end },
      opening_balance: account.balance - totalPnl,
      closing_balance: account.balance,
      transactions: txns,
      trades,
      trade_count: trades.length,
      total_pnl: totalPnl,
    };
    return Promise.resolve(mockStmt);
  }
  return clientApi
    .get<{ success: boolean; data: ClientStatement }>(
      '/client/statement', { params: { mt5_login, start, end } }
    )
    .then((r) => r.data.data);
};
