import { api } from './client';

export const fixedAssetsApi = {
  getCategories:     ()                                => api.get('/fixed-assets/categories'),
  createCategory:    (data: Record<string, unknown>)   => api.post('/fixed-assets/categories', data),
  getAssets:         (params?: Record<string, string>) => api.get('/fixed-assets', { params }),
  createAsset:       (data: Record<string, unknown>)   => api.post('/fixed-assets', data),
  getDepreciation:   (id: string)                      => api.get(`/fixed-assets/${id}/depreciation`),
  getMaintenance:    (id: string)                      => api.get(`/fixed-assets/${id}/maintenance`),
  addMaintenance:    (id: string, data: Record<string, unknown>) => api.post(`/fixed-assets/${id}/maintenance`, data),
  disposeAsset:      (id: string, data: Record<string, unknown>) => api.post(`/fixed-assets/${id}/dispose`, data),
};

