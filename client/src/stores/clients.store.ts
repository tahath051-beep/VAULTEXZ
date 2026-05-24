import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  seedClientRecords,
  seedIBRecords,
  type ClientRecord,
  type IBRecord,
  type IBClassification,
} from '@/lib/workbook';

interface ClientsState {
  clients: ClientRecord[];
  ibs: IBRecord[];
  ibClassifications: IBClassification[];

  addClient: (input: Omit<ClientRecord, 'id'>) => void;
  updateClient: (id: string, partial: Partial<ClientRecord>) => void;
  setClientActive: (id: string, active: boolean) => void;
  addIB: (input: Omit<IBRecord, 'id'>) => void;
  updateIB: (id: string, partial: Partial<IBRecord>) => void;
  setIBActive: (id: string, active: boolean) => void;
  addIBClassification: (label: string) => void;
  removeIBClassification: (label: string) => void;
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set) => ({
      clients: seedClientRecords,
      ibs: seedIBRecords,
      ibClassifications: ['trusted', 'hard_debt', 'impossible_debt'],

      addClient: (input) => {
        const id = `cl-${Date.now()}`;
        set((s) => ({ clients: [...s.clients, { ...input, id }] }));
      },

      updateClient: (id, partial) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        }));
      },

      setClientActive: (id, active) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, active } : c)),
        }));
      },

      addIB: (input) => {
        const id = `ib-${Date.now()}`;
        set((s) => ({ ibs: [...s.ibs, { ...input, id }] }));
      },

      updateIB: (id, partial) => {
        set((s) => ({
          ibs: s.ibs.map((ib) => (ib.id === id ? { ...ib, ...partial } : ib)),
        }));
      },

      setIBActive: (id, active) => {
        set((s) => ({
          ibs: s.ibs.map((ib) => (ib.id === id ? { ...ib, active } : ib)),
        }));
      },

      addIBClassification: (label) => {
        set((s) => ({
          ibClassifications: s.ibClassifications.includes(label)
            ? s.ibClassifications
            : [...s.ibClassifications, label],
        }));
      },

      removeIBClassification: (label) => {
        set((s) => ({
          ibClassifications: s.ibClassifications.filter((c) => c !== label),
        }));
      },
    }),
    { name: 'fx-clients' },
  ),
);
