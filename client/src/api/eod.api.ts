import { api } from './client';

export interface EODStatus {
  id: string; eod_date: string; status: string; records_processed?: number;
  error_message?: string; locked_by_name?: string; created_at: string; completed_at?: string;
}

export const triggerEOD = (date: string) =>
  api.post<{ success: boolean; data: { jobId: string; message: string } }>('/eod/trigger', { date }).then((r) => r.data.data);

export const getEODStatus = (date: string) =>
  api.get<{ success: boolean; data: EODStatus }>(`/eod/status/${date}`).then((r) => r.data.data);
