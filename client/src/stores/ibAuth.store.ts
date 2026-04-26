import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IBUser {
  id: string;
  email: string;
  full_name: string;
  ib_code: string;
  level: number;
  level_label: string;
  status: string;
  commission_plan: string;
  commission_rate: string;
  joined_at: string;
  payment_method: string;
  bank_details: string;
  referral_link: string;
  referral_clicks: number;
}

interface IBAuthState {
  token: string | null;
  ibUser: IBUser | null;
  setAuth: (token: string, user: IBUser) => void;
  logout: () => void;
}

export const useIBAuthStore = create<IBAuthState>()(
  persist(
    (set) => ({
      token: null,
      ibUser: null,
      setAuth: (token, ibUser) => set({ token, ibUser }),
      logout: () => set({ token: null, ibUser: null }),
    }),
    {
      name: 'ib-auth-storage',
      partialize: (s) => ({ token: s.token, ibUser: s.ibUser }),
    }
  )
);
