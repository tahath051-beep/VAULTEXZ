import { api } from './client';

export interface COAAccount {
  id: string; code: string; name: string; type: string; subtype?: string;
  normal_balance: string; parent_id?: string; is_system: boolean; is_active: boolean;
  parent_code?: string; parent_name?: string;
  total_debit?: string; total_credit?: string; balance?: string;
}

export const getCOA = (q: { type?: string; is_system?: boolean; is_active?: boolean } = {}) =>
  api.get<{ success: boolean; data: { accounts: COAAccount[] } }>('/chart-of-accounts', { params: q }).then((r) => r.data.data);

export const getCOAAccount = (id: string) =>
  api.get<{ success: boolean; data: COAAccount }>(`/chart-of-accounts/${id}`).then((r) => r.data.data);

export const createCOAAccount = (data: Partial<COAAccount>) =>
  api.post<{ success: boolean; data: COAAccount }>('/chart-of-accounts', data).then((r) => r.data.data);

export const updateCOAAccount = (id: string, data: { name?: string; is_active?: boolean }) =>
  api.patch<{ success: boolean; data: COAAccount }>(`/chart-of-accounts/${id}`, data).then((r) => r.data.data);
