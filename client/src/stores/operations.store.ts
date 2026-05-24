import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  seedOperationRequests,
  seedAlerts,
  type OperationRequest,
  type RequestLine,
  type RequestType,
  type TimelineEvent,
  type OperationsSettings,
  type SmartAlert,
  type AlertType,
} from '@/lib/workbook';
import { useWorkbookStore } from '@/stores/workbook.store';

interface OperationsState {
  requests: OperationRequest[];
  settings: OperationsSettings;
  alerts: SmartAlert[];
  nextRequestNo: number;

  addRequest: (input: Omit<OperationRequest, 'id' | 'requestNo' | 'timeline' | 'status'>) => OperationRequest;
  confirmRequest: (id: string, confirmedBy: string) => void;
  executeRequest: (id: string, executedBy: string) => void;
  createVoucher: (id: string) => void;
  updateRequestLines: (id: string, lines: RequestLine[]) => void;
  generateAlerts: () => void;
  markAlertRead: (id: string) => void;
  clearAlert: (id: string) => void;
  updateSettings: (partial: Partial<OperationsSettings>) => void;
  getPendingCount: () => number;
  getUrgentCount: () => number;
  getTodayVolume: () => number;
}

const requestTypeToOpType: Record<RequestType, string> = {
  deposit: 'تعزيز',
  ib_deposit: 'تعزيز',
  withdrawal: 'سحب',
  ib_withdrawal: 'سحب',
  transfer_to: 'تحويل الى',
  transfer_from: 'تحويل من',
  expense: 'سحب',
};

function makeId() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeAlertId() {
  return `alt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}


export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
      requests: seedOperationRequests,
      settings: {
        requireDifferentConfirmer: false,
        manualMT5Execution: true,
        digitalWalletMode: false,
        urgentThresholdHours: 4,
        largeTransactionThreshold: 10000,
      },
      alerts: seedAlerts,
      nextRequestNo: seedOperationRequests.length + 1,

      addRequest: (input) => {
        const state = get();
        const requestNo = state.nextRequestNo;
        const newRequest: OperationRequest = {
          ...input,
          id: makeId(),
          requestNo,
          status: 'pending',
          timeline: [
            {
              action: 'created',
              by: input.createdBy,
              at: new Date().toISOString(),
            },
          ],
        };
        set((s) => ({
          requests: [newRequest, ...s.requests],
          nextRequestNo: s.nextRequestNo + 1,
        }));
        return newRequest;
      },

      confirmRequest: (id, confirmedBy) => {
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id || r.status !== 'pending') return r;
            const event: TimelineEvent = { action: 'confirmed', by: confirmedBy, at: new Date().toISOString() };
            return { ...r, status: 'confirmed', confirmedBy, timeline: [...r.timeline, event] };
          }),
        }));
      },

      executeRequest: (id, executedBy) => {
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id || r.status !== 'confirmed') return r;
            const event: TimelineEvent = { action: 'executed', by: executedBy, at: new Date().toISOString() };
            return { ...r, status: 'executed', executedBy, timeline: [...r.timeline, event] };
          }),
        }));
      },

      createVoucher: (id) => {
        const state = get();
        const req = state.requests.find((r) => r.id === id);
        if (!req || req.status !== 'executed') return;

        const wbStore = useWorkbookStore.getState();
        const voucherRef = `REQ-${String(req.requestNo).padStart(3, '0')}-V`;

        req.lines.forEach((line) => {
          const opType = requestTypeToOpType[req.type] as any;
          const counterCode = line.counterAccountCode ?? 'MISC';
          wbStore.addEntry({
            date: req.date,
            opType,
            amount: line.amount,
            accountCode: line.accountNo,
            counterAccountCode: counterCode,
            currency: line.currency,
            note: `${voucherRef} · ${req.type}`,
          });
        });

        const event: TimelineEvent = { action: 'voucher', by: req.executedBy ?? 'system', at: new Date().toISOString() };
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: 'voucher', voucherRef, timeline: [...r.timeline, event] } : r,
          ),
        }));
      },

      updateRequestLines: (id, lines) => {
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, lines } : r)),
        }));
      },

      generateAlerts: () => {
        const state = get();
        const newAlerts: SmartAlert[] = [];
        const now = new Date();

        // Pending expired
        state.requests.forEach((r) => {
          if (r.status !== 'pending') return;
          const created = new Date(r.timeline[0]?.at ?? r.date);
          const hoursOld = (now.getTime() - created.getTime()) / 3_600_000;
          if (hoursOld > state.settings.urgentThresholdHours && !state.alerts.find((a) => a.linkedRequestId === r.id && a.type === 'pending_expired')) {
            newAlerts.push({
              id: makeAlertId(),
              type: 'pending_expired' as AlertType,
              severity: 'warning',
              title: 'Pending Request Overdue',
              body: `Request REQ-${String(r.requestNo).padStart(3, '0')} has been pending for over ${state.settings.urgentThresholdHours}h.`,
              createdAt: now.toISOString(),
              read: false,
              linkedRequestId: r.id,
            });
          }
        });

        // Large transactions
        state.requests.forEach((r) => {
          const total = r.lines.reduce((s, l) => s + l.amount, 0);
          if (total > state.settings.largeTransactionThreshold && !state.alerts.find((a) => a.linkedRequestId === r.id && a.type === 'large_transaction')) {
            newAlerts.push({
              id: makeAlertId(),
              type: 'large_transaction' as AlertType,
              severity: 'info',
              title: 'Large Transaction Detected',
              body: `Request REQ-${String(r.requestNo).padStart(3, '0')} total $${total.toLocaleString()} exceeds the threshold.`,
              createdAt: now.toISOString(),
              read: false,
              linkedRequestId: r.id,
            });
          }
        });

        if (newAlerts.length > 0) {
          set((s) => ({ alerts: [...newAlerts, ...s.alerts] }));
        }
      },

      markAlertRead: (id) => {
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) }));
      },

      clearAlert: (id) => {
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }));
      },

      updateSettings: (partial) => {
        set((s) => ({ settings: { ...s.settings, ...partial } }));
      },

      getPendingCount: () => get().requests.filter((r) => r.status === 'pending').length,

      getUrgentCount: () => {
        const state = get();
        const now = new Date();
        return state.requests.filter((r) => {
          if (r.status !== 'pending') return false;
          const created = new Date(r.timeline[0]?.at ?? r.date);
          return (now.getTime() - created.getTime()) / 3_600_000 > state.settings.urgentThresholdHours
            || r.priority === 'urgent';
        }).length;
      },

      getTodayVolume: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().requests
          .filter((r) => r.date === today && (r.status === 'executed' || r.status === 'voucher'))
          .flatMap((r) => r.lines)
          .reduce((s, l) => s + l.amount, 0);
      },
    }),
    {
      name: 'fx-operations',
      partialize: (s) => ({
        requests: s.requests.map((r) => ({ ...r, attachmentBase64: undefined })),
        settings: s.settings,
        alerts: s.alerts,
        nextRequestNo: s.nextRequestNo,
      }),
    },
  ),
);
