import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LockedPeriod {
  id: string;
  label: string; // e.g. "May 2026"
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
  lockedAt: string; // ISO timestamp
  lockedBy: string; // user email
}

export interface RateAlert {
  id: string;
  pair: string;   // e.g. "USD/TRY"
  condition: 'above' | 'below';
  threshold: number;
  active: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface GeneralConfig {
  brokerName: string;
  timezone: string;
  defaultCurrency: string;
  reconciliationThreshold: number; // %
  eodScheduleTime: string; // HH:MM
  requireDualApproval: boolean;
}

interface SettingsState {
  lockedPeriods: LockedPeriod[];
  rateAlerts: RateAlert[];
  general: GeneralConfig;

  // Period actions
  lockPeriod: (from: string, to: string, label: string, by: string) => void;
  unlockPeriod: (id: string) => void;
  isPeriodLocked: (date: string) => boolean;

  // Alert actions
  addRateAlert: (alert: Omit<RateAlert, 'id' | 'createdAt'>) => void;
  removeRateAlert: (id: string) => void;
  toggleRateAlert: (id: string) => void;
  triggerRateAlert: (id: string) => void;

  // General
  updateGeneral: (patch: Partial<GeneralConfig>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      lockedPeriods: [],
      rateAlerts: [],
      general: {
        brokerName: 'Vaultex FX',
        timezone: 'Asia/Riyadh',
        defaultCurrency: 'USD',
        reconciliationThreshold: 1,
        eodScheduleTime: '23:59',
        requireDualApproval: false,
      },

      lockPeriod: (from, to, label, by) =>
        set((s) => ({
          lockedPeriods: [
            ...s.lockedPeriods,
            {
              id: crypto.randomUUID(),
              label,
              from,
              to,
              lockedAt: new Date().toISOString(),
              lockedBy: by,
            },
          ],
        })),

      unlockPeriod: (id) =>
        set((s) => ({ lockedPeriods: s.lockedPeriods.filter((p) => p.id !== id) })),

      isPeriodLocked: (date) => {
        const { lockedPeriods } = get();
        return lockedPeriods.some((p) => date >= p.from && date <= p.to);
      },

      addRateAlert: (alert) =>
        set((s) => ({
          rateAlerts: [
            ...s.rateAlerts,
            { ...alert, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),

      removeRateAlert: (id) =>
        set((s) => ({ rateAlerts: s.rateAlerts.filter((a) => a.id !== id) })),

      toggleRateAlert: (id) =>
        set((s) => ({
          rateAlerts: s.rateAlerts.map((a) =>
            a.id === id ? { ...a, active: !a.active } : a,
          ),
        })),

      triggerRateAlert: (id) =>
        set((s) => ({
          rateAlerts: s.rateAlerts.map((a) =>
            a.id === id ? { ...a, triggeredAt: new Date().toISOString() } : a,
          ),
        })),

      updateGeneral: (patch) =>
        set((s) => ({ general: { ...s.general, ...patch } })),
    }),
    { name: 'vaultex-settings' },
  ),
);
