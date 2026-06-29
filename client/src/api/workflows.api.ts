import { api } from './client';

export const workflowsApi = {
  getTemplates:   ()                                => api.get('/workflows/templates'),
  createTemplate: (data: Record<string, unknown>)   => api.post('/workflows/templates', data),
  getStages:      (templateId: string)              => api.get(`/workflows/templates/${templateId}/stages`),
  addStage:       (templateId: string, data: Record<string, unknown>) => api.post(`/workflows/templates/${templateId}/stages`, data),
  getInstances:   (params?: Record<string, string>) => api.get('/workflows/instances', { params }),
  getInstance:    (id: string)                      => api.get(`/workflows/instances/${id}`),
  getMyTasks:     ()                                => api.get('/workflows/my-tasks'),
  actOnTask:      (taskId: string, data: Record<string, unknown>) => api.post(`/workflows/tasks/${taskId}/action`, data),
};

