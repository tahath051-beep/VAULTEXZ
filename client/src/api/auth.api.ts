import { authApi } from './client';

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

export const authLogin = (data: LoginInput): Promise<LoginResponse> =>
  authApi
    .post<{ success: boolean; data: LoginResponse }>('/login', data)
    .then((r) => r.data.data);

export const authRefresh = (token: string): Promise<string> =>
  authApi
    .post<{ success: boolean; data: { token: string } }>('/refresh', { token })
    .then((r) => r.data.data.token);

export const authLogout = (token: string) =>
  authApi.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
