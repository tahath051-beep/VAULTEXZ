import { api } from './client';

export const ownershipApi = {
  getShareholders:    ()                                => api.get('/ownership/shareholders'),
  createShareholder:  (data: Record<string, unknown>)   => api.post('/ownership/shareholders', data),
  getContributions:   ()                                => api.get('/ownership/contributions'),
  createContribution: (data: Record<string, unknown>)   => api.post('/ownership/contributions', data),
  getDistributions:   ()                                => api.get('/ownership/distributions'),
  createDistribution: (data: Record<string, unknown>)   => api.post('/ownership/distributions', data),
  getDistributionLines:(id: string)                     => api.get(`/ownership/distributions/${id}/lines`),
  approveDistribution:(id: string)                      => api.post(`/ownership/distributions/${id}/approve`, {}),
};

