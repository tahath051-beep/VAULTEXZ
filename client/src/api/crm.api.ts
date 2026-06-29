import { api } from './client';

export const crmApi = {
  // Leads
  getLeads:      (params?: Record<string, string>) => api.get('/crm/leads', { params }),
  createLead:    (data: Record<string, unknown>)   => api.post('/crm/leads', data),
  updateLead:    (id: string, data: Record<string, unknown>) => api.patch(`/crm/leads/${id}`, data),
  convertLead:   (id: string, data: Record<string, unknown>) => api.post(`/crm/leads/${id}/convert`, data),

  // Activities
  getActivities: (params?: Record<string, string>) => api.get('/crm/activities', { params }),
  createActivity:(data: Record<string, unknown>)   => api.post('/crm/activities', data),

  // Tickets
  getTickets:    (params?: Record<string, string>) => api.get('/crm/tickets', { params }),
  createTicket:  (data: Record<string, unknown>)   => api.post('/crm/tickets', data),
  updateTicket:  (id: string, data: Record<string, unknown>) => api.patch(`/crm/tickets/${id}`, data),
  getMessages:   (ticketId: string)                => api.get(`/crm/tickets/${ticketId}/messages`),
  addMessage:    (ticketId: string, data: Record<string, unknown>) => api.post(`/crm/tickets/${ticketId}/messages`, data),
};

