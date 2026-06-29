import { api } from './client';

export const hrApi = {
  getEmployees:       (params?: Record<string, string>) => api.get('/hr/employees', { params }),
  createEmployee:     (data: Record<string, unknown>)   => api.post('/hr/employees', data),
  getEmployee:        (id: string)                      => api.get(`/hr/employees/${id}`),
  getLeaveTypes:      ()                                => api.get('/hr/leave-types'),
  createLeaveType:    (data: Record<string, unknown>)   => api.post('/hr/leave-types', data),
  getLeaveRequests:   (params?: Record<string, string>) => api.get('/hr/leave-requests', { params }),
  createLeaveRequest: (data: Record<string, unknown>)   => api.post('/hr/leave-requests', data),
  approveLeave:       (id: string, data: Record<string, unknown>) => api.post(`/hr/leave-requests/${id}/approve`, data),
  getPayrollRuns:     ()                                => api.get('/hr/payroll-runs'),
  createPayrollRun:   (data: Record<string, unknown>)   => api.post('/hr/payroll-runs', data),
  getPayrollItems:    (runId: string)                   => api.get(`/hr/payroll-runs/${runId}/items`),
  addPayrollItem:     (runId: string, data: Record<string, unknown>) => api.post(`/hr/payroll-runs/${runId}/items`, data),
};

