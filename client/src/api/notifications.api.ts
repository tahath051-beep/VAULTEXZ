import api from './axios';

export const notificationsApi = {
  getNotifications: (params?: { is_read?: boolean; limit?: number; offset?: number }) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markRead: (id: string) =>
    api.post(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),
};
