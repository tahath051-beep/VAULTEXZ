import { api } from './client';

export interface Client {
  id: string; client_code: string; full_name: string; email: string;
  phone?: string; country?: string; is_active: boolean; created_at: string;
  mt5_account_count?: number;
}

export interface ClientDetail extends Client {
  mt5_accounts: Array<{ id: string; mt5_login: number; currency: string; book_type: string; current_balance: string }>;
}

export interface ClientsQuery { search?: string; is_active?: boolean; limit?: number; offset?: number; }

export const getClients = (q: ClientsQuery = {}) =>
  api.get<{ success: boolean; data: { clients: Client[]; limit: number; offset: number } }>('/clients', { params: q }).then((r) => r.data.data);

export const getClient = (id: string) =>
  api.get<{ success: boolean; data: ClientDetail }>(`/clients/${id}`).then((r) => r.data.data);

export const createClient = (data: Partial<Client>) =>
  api.post<{ success: boolean; data: Client }>('/clients', data).then((r) => r.data.data);

export const updateClient = (id: string, data: Partial<Client>) =>
  api.patch<{ success: boolean; data: Client }>(`/clients/${id}`, data).then((r) => r.data.data);
