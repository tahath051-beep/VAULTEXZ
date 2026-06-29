import { api } from './client';

export const riskApi = {
  getLatestSnapshot: ()                                => api.get('/risk/snapshots/latest'),
  getSnapshots:      (params?: Record<string, string>) => api.get('/risk/snapshots', { params }),
  getCoverage:       (params?: Record<string, string>) => api.get('/risk/coverage', { params }),
  createCoverage:    (data: Record<string, unknown>)   => api.post('/risk/coverage', data),
  getLimits:         ()                                => api.get('/risk/limits'),
  createLimit:       (data: Record<string, unknown>)   => api.post('/risk/limits', data),
  getAlerts:         ()                                => api.get('/risk/alerts'),
  acknowledgeAlert:  (id: string)                      => api.post(`/risk/alerts/${id}/acknowledge`, {}),
};

