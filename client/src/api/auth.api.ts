import { authApi } from './client';
import { MOCK_TOKEN, MOCK_USER, mockAuthData } from '../mocks/data/auth.mock';

export interface LoginInput { email: string; password: string; }

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  permissions: string[];
}

export const authLogin = (data: LoginInput): Promise<LoginResponse> => {
  if (import.meta.env.PROD) {
    if (data.email === mockAuthData.validEmail && data.password === mockAuthData.validPassword) {
      return Promise.resolve({ token: MOCK_TOKEN, user: MOCK_USER, permissions: [] });
    }
    return Promise.reject(new Error('Login failed — check credentials'));
  }
  return authApi
    .post<{ success: boolean; data: LoginResponse }>('/login', data)
    .then((r) => r.data.data);
};

export const authRefresh = (token: string): Promise<string> => {
  if (import.meta.env.PROD) return Promise.resolve(token);
  return authApi
    .post<{ success: boolean; data: { token: string } }>('/refresh', { token })
    .then((r) => r.data.data.token);
};

export const authLogout = (token: string) => {
  if (import.meta.env.PROD) return Promise.resolve();
  return authApi.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
};
