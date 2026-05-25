import axios from 'axios';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import type { IBUser } from '@/stores/ibAuth.store';
import {
  MOCK_IB_TOKEN, MOCK_IB_USER,
  mockIBSubIBs, mockIBClients, mockIBCommissionEntries,
  mockIBDailyStats, mockIBNotifications,
} from '@/mocks/data/ib.mock';

const DEMO_EMAIL    = 'ib@demo.com';
const DEMO_PASSWORD = 'Demo@123456';

export const ibApi = axios.create({ baseURL: '/api/v1', timeout: 30000 });

ibApi.interceptors.request.use((config) => {
  const token = useIBAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

ibApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) useIBAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const ibLogin = (email: string, password: string) => {
  if (import.meta.env.PROD) {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return Promise.resolve({ token: MOCK_IB_TOKEN, user: MOCK_IB_USER });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }
  return ibApi
    .post<{ success: boolean; data: { token: string; user: IBUser } }>(
      '/ib/auth/login', { email, password }
    )
    .then((r) => r.data.data);
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const getIBProfile = () => {
  if (import.meta.env.PROD) return Promise.resolve(MOCK_IB_USER);
  return ibApi
    .get<{ success: boolean; data: IBUser }>('/ib/me')
    .then((r) => r.data.data);
};

export const changeIBPassword = (d: { current_password: string; new_password: string }) => {
  if (import.meta.env.PROD) return Promise.resolve({ message: 'Password changed (demo mode)' });
  return ibApi
    .post<{ success: boolean; data: { message: string } }>('/ib/me/change-password', d)
    .then((r) => r.data.data);
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface IBSubIB {
  id: string; ib_code: string; full_name: string; level: number; level_label: string;
  clients: number; total_volume: number; total_commission: number; status: string;
}

export interface IBDailyStats { day: string; date: string; amount: number; }

export interface IBDashboard {
  metrics: {
    total_commission: number;
    pending_commission: number;
    locked_commission: number;
    paid_commission: number;
    total_clients: number;
    active_clients_month: number;
  };
  daily_stats: IBDailyStats[];
  top_clients: IBClient[];
  sub_ibs: IBSubIB[];
}

export const getIBDashboard = () => {
  if (import.meta.env.PROD) {
    const paid    = mockIBCommissionEntries.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
    const locked  = mockIBCommissionEntries.filter((c) => c.status === 'LOCKED').reduce((s, c) => s + c.amount, 0);
    const pending = mockIBCommissionEntries.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
    const mockDash: IBDashboard = {
      metrics: {
        total_commission: paid + locked + pending,
        pending_commission: pending,
        locked_commission: locked,
        paid_commission: paid,
        total_clients: mockIBClients.length,
        active_clients_month: mockIBClients.filter((c) => c.is_active).length,
      },
      daily_stats: mockIBDailyStats,
      top_clients: [...mockIBClients]
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, 5),
      sub_ibs: mockIBSubIBs,
    };
    return Promise.resolve(mockDash);
  }
  return ibApi
    .get<{ success: boolean; data: IBDashboard }>('/ib/dashboard')
    .then((r) => r.data.data);
};

// ── Commissions ───────────────────────────────────────────────────────────────
export interface IBCommission {
  id: string; date: string; client: string; client_code: string;
  symbol: string; volume: number; commission_type: string;
  amount: number; status: string; ticket: number;
}

export interface IBCommissionSummary {
  total_pending: number; total_locked: number; total_paid_month: number;
}

export const getIBCommissions = (status?: string) => {
  if (import.meta.env.PROD) {
    const entries = status
      ? mockIBCommissionEntries.filter((c) => c.status === status.toUpperCase())
      : mockIBCommissionEntries;
    const summary: IBCommissionSummary = {
      total_pending:    mockIBCommissionEntries.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0),
      total_locked:     mockIBCommissionEntries.filter((c) => c.status === 'LOCKED').reduce((s, c) => s + c.amount, 0),
      total_paid_month: mockIBCommissionEntries.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0),
    };
    return Promise.resolve({ commissions: entries, summary });
  }
  return ibApi
    .get<{ success: boolean; data: { commissions: IBCommission[]; summary: IBCommissionSummary } }>(
      '/ib/commissions', { params: status ? { status } : {} }
    )
    .then((r) => r.data.data);
};

export const requestIBPayout = (d: { gateway: string; details: string }) => {
  if (import.meta.env.PROD) {
    const pending = mockIBCommissionEntries
      .filter((c) => c.status === 'PENDING')
      .reduce((s, c) => s + c.amount, 0);
    return Promise.resolve({ message: `Payout of $${pending.toFixed(2)} requested via ${d.gateway} (demo)`, amount: pending });
  }
  return ibApi
    .post<{ success: boolean; data: { message: string; amount: number } }>(
      '/ib/payout/request', d
    )
    .then((r) => r.data.data);
};

// ── Clients ────────────────────────────────────────────────────────────────────
export interface IBClient {
  id: string; client_code: string; full_name: string; registered_at: string;
  total_volume: number; total_trades: number; commission_generated: number; is_active: boolean;
}

export const getIBClients = () => {
  if (import.meta.env.PROD) return Promise.resolve(mockIBClients);
  return ibApi
    .get<{ success: boolean; data: { clients: IBClient[] } }>('/ib/clients')
    .then((r) => r.data.data.clients);
};

// ── Notifications ─────────────────────────────────────────────────────────────
export interface IBNotification {
  id: string; title: string; description: string; is_read: boolean; created_at: string;
}

export const getIBNotifications = () => {
  if (import.meta.env.PROD) return Promise.resolve(mockIBNotifications);
  return ibApi
    .get<{ success: boolean; data: { notifications: IBNotification[] } }>('/ib/notifications')
    .then((r) => r.data.data.notifications);
};

export const markIBNotificationRead = (id: string) => {
  if (import.meta.env.PROD) {
    const n = mockIBNotifications.find((x) => x.id === id);
    if (n) n.is_read = true;
    return Promise.resolve({});
  }
  return ibApi.patch(`/ib/notifications/${id}/read`);
};
