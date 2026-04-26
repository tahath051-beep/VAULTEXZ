import { api } from './client';

export interface JournalLine {
  id?: string; account_id: string; account_code?: string; account_name?: string;
  debit: string; credit: string; narration?: string;
}

export interface Journal {
  id: string; entry_date: string; reference_type: string; reference_id?: string;
  narration: string; status: string; created_by?: string; created_at: string;
  lines?: JournalLine[];
}

export interface JournalsQuery {
  reference_type?: string; start_date?: string; end_date?: string;
  limit?: number; offset?: number;
}

export const getJournals = (q: JournalsQuery = {}) =>
  api.get<{ success: boolean; data: { journals: Journal[]; limit: number; offset: number } }>('/journals', { params: q }).then((r) => r.data.data);

export const getJournal = (id: string) =>
  api.get<{ success: boolean; data: Journal }>(`/journals/${id}`).then((r) => r.data.data);

export const createJournal = (data: { narration: string; entry_date: string; lines: JournalLine[] }) =>
  api.post<{ success: boolean; data: Journal }>('/journals', data).then((r) => r.data.data);
