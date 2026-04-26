import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClientUser {
  id: string;
  email: string;
  full_name: string;
  client_code: string;
  phone?: string;
  country?: string;
  kyc_status: string;
  linked_ib?: string;
  created_at?: string;
}

interface ClientAuthState {
  token: string | null;
  clientUser: ClientUser | null;
  selectedMt5Id: string | null;
  setAuth: (token: string, user: ClientUser) => void;
  setSelectedMt5: (id: string | null) => void;
  logout: () => void;
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set) => ({
      token: null,
      clientUser: null,
      selectedMt5Id: null,
      setAuth: (token, clientUser) => set({ token, clientUser }),
      setSelectedMt5: (selectedMt5Id) => set({ selectedMt5Id }),
      logout: () => set({ token: null, clientUser: null, selectedMt5Id: null }),
    }),
    {
      name: 'client-auth-storage',
      partialize: (s) => ({ token: s.token, clientUser: s.clientUser, selectedMt5Id: s.selectedMt5Id }),
    }
  )
);
