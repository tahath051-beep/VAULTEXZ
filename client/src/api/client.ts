import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({ baseURL: '/api/v1', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { token, logout } = useAuthStore.getState();
      if (token) {
        try {
          const { data } = await axios.post('/auth/refresh', { token });
          const newToken = data.data?.token ?? data.data?.accessToken;
          useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user!);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = axios.create({ baseURL: '/auth', timeout: 30000 });
