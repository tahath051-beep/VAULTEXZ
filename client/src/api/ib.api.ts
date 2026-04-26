import axios from 'axios';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import type { IBUser } from '@/stores/ibAuth.store';

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
export const ibLogin = (email: string, password: string) =>
  ibApi.post<{ success: boolean; data: { token: string; user: IBUser } }>(
    '/ib/auth/login', { email, password }
  ).then((r) => r.data.data);

// ── Profile ───────────────────────────────────────────────────────────────────
export const getIBProfile = () =>
  ibApi.get<{ success: boolean; data: IBUser }>('/ib/me').then((r) => r.data.data);

export const changeIBPassword = (d: { current_password: string; new_password: string }) =>
  ibApi.post<{ success: boolean; data: { message: string } }>('/ib/me/change-password', d)
    .then((r) => r.data.data);

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

export const getIBDashboard = () =>
  ibApi.get<{ success: boolean; data: IBDashboard }>('/ib/dashboard').then((r) => r.data.data);

// ── Commissions ───────────────────────────────────────────────────────────────
export interface IBCommission {
  id: string; date: string; client: string; client_code: string;
  symbol: string; volume: number; commission_type: string;
  amount: number; status: string; ticket: number;
}

export interface IBCommissionSummary {
  total_pending: number; total_locked: number; total_paid_month: number;
}

export const getIBCommissions = (status?: string) =>
  ibApi.get<{ success: boolean; data: { commissions: IBCommission[]; summary: IBCommissionSummary } }>(
    '/ib/commissions', { params: status ? { status } : {} }
  ).then((r) => r.data.data);

export const requestIBPayout = (d: { gateway: string; details: string }) =>
  ibApi.post<{ success: boolean; data: { message: string; amount: number } }>(
    '/ib/payout/request', d
  ).then((r) => r.data.data);

// ── Clients ────────────────────────────────────────────────────────────────────
export interface IBClient {
  id: string; client_code: string; full_name: string; registered_at: string;
  total_volume: number; total_trades: number; commission_generated: number; is_active: boolean;
}

export const getIBClients = () =>
  ibApi.get<{ success: boolean; data: { clients: IBClient[] } }>('/ib/clients')
    .then((r) => r.data.data.clients);

// ── Notifications ─────────────────────────────────────────────────────────────
export interface IBNotification {
  id: string; title: string; description: string; is_read: boolean; created_at: string;
}

export const getIBNotifications = () =>
  ibApi.get<{ success: boolean; data: { notifications: IBNotification[] } }>('/ib/notifications')
    .then((r) => r.data.data.notifications);

export const markIBNotificationRead = (id: string) =>
  ibApi.patch(`/ib/notifications/${id}/read`);
