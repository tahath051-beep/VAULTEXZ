import { api } from './client';

export const branchesApi = {
  getBranches:       ()                                => api.get('/branches'),
  createBranch:      (data: Record<string, unknown>)   => api.post('/branches', data),
  updateBranch:      (id: string, data: Record<string, unknown>) => api.patch(`/branches/${id}`, data),
  getDepartments:    (branchId: string)                => api.get(`/branches/${branchId}/departments`),
  createDepartment:  (branchId: string, data: Record<string, unknown>) => api.post(`/branches/${branchId}/departments`, data),
};

