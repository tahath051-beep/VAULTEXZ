import { api } from './client';

export interface Payment {
  id: string; client_id: string; mt5_account_id?: string; payment_type: string;
  amount: string; currency: string; status: string; narration?: string;
  reference_number?: string; journal_id?: string; created_at: string;
  client_name?: string; client_code?: string; mt5_login?: number;
}

export interface PaymentsQuery {
  status?: string; payment_type?: string; client_id?: string;
  start_date?: string; end_date?: string; limit?: number; offset?: number;
}

export const getPayments = (q: PaymentsQuery = {}) =>
  api.get<{ success: boolean; data: { payments: Payment[]; limit: number; offset: number } }>('/payments', { params: q }).then((r) => r.data.data);

export const createPayment = (data: Partial<Payment>) =>
  api.post<{ success: boolean; data: Payment }>('/payments', data).then((r) => r.data.data);

export const approvePayment = (id: string) =>
  api.patch<{ success: boolean; data: Payment }>(`/payments/${id}/approve`).then((r) => r.data.data);

export const rejectPayment = (id: string, reason?: string) =>
  api.patch<{ success: boolean; data: Payment }>(`/payments/${id}/reject`, { reason }).then((r) => r.data.data);
