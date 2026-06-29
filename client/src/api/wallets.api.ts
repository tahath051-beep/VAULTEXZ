import api from './axios';

export const walletsApi = {
  getWallets: (params?: Record<string, string>) =>
    api.get('/wallets', { params }),

  getTransactions: (walletId: string, params?: Record<string, string>) =>
    api.get(`/wallets/${walletId}/transactions`, { params }),

  adjust: (walletId: string, body: { type: 'CREDIT' | 'DEBIT'; amount: number; currency: string; description: string; reference?: string }) =>
    api.post(`/wallets/${walletId}/adjust`, body),
};
