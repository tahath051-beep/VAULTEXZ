import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWorkbookStore } from '@/stores/workbook.store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpStatus = 'pending' | 'verification' | 'execution' | 'completed' | 'rejected' | 'trashed';
export type OpType =
  | 'deposit' | 'withdrawal' | 'agent_deposit' | 'agent_withdrawal'
  | 'transfer_from' | 'transfer_to' | 'expense';
export type OpSource = 'manual' | 'app';

export interface OpAccount {
  id: string;
  name: string;
  name_ar: string;
  code: string;
}

export interface OpLine {
  id: string;
  line_number: number;
  mt5_account_number: string;
  account_id: string;
  account_name: string;
  counter_account_id: string;
  counter_account_name: string;
  currency: string;
  amount_in_currency: number;
  exchange_rate: number;
  amount_usd: number;
  payment_method_id?: string;
}

export interface WorkflowStep {
  id: string;
  action: 'created' | 'advanced' | 'rejected' | 'trashed';
  performed_by: string;
  performed_at: string;
  from_status: OpStatus;
  to_status: OpStatus;
  notes?: string;
  verified_account_id?: string;
}

export interface OpRequest {
  id: string;
  request_number: string;
  request_type: OpType;
  status: OpStatus;
  source: OpSource;
  created_by: string;
  created_at: string;
  request_date: string;
  notes_1: string;
  notes_2?: string;
  total_amount_usd: number;
  lines: OpLine[];
  workflow: WorkflowStep[];
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  journal_entry_ref?: string;
}

export interface PaymentMethod {
  id: string;
  name_ar: string;
  name_en: string;
  account_id: string;
  account_name: string;
  is_active: boolean;
}

export interface ExchangeRate {
  id: string;
  currency_code: string;
  rate_to_usd: number;
  rate_date: string;
  source: 'manual' | 'api';
  created_by: string;
  created_at: string;
}

export interface OpModuleSettings {
  wallet_mode_enabled: boolean;
  agent_range_start: number;
  agent_range_end: number;
  exchange_rate_api_url: string;
}

// ─── Mock COA Accounts ────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: OpAccount[] = [
  { id: 'mt5-traders',       name: 'MT5 Account Traders',    name_ar: 'حسابات المتداولين MT5',  code: 'MT5TR'  },
  { id: 'mt5-agents',        name: 'MT5 Agents',             name_ar: 'الوكلاء MT5',            code: 'MT5AG'  },
  { id: 'cash-001',          name: 'Cash – Kilis Office',    name_ar: 'صندوق نقدي – كلس',      code: '1272'   },
  { id: 'cash-002',          name: 'Cash – Ankara Office',   name_ar: 'صندوق نقدي – أنقرة',   code: '13304'  },
  { id: 'bank-kt-usd',       name: 'Kuveyt Turk – USD',      name_ar: 'كويت تورك – دولار',     code: 'KT-USD' },
  { id: 'bank-baraka',       name: 'Baraka – Lira',          name_ar: 'بنك البركة – ليرة',      code: '13239'  },
  { id: 'usdt-klaho',        name: 'USDT – KLAHO',           name_ar: 'USDT كلاهو',            code: '139'    },
  { id: 'ib-ali-hassan',     name: 'IB – Ali Hassan',        name_ar: 'وكيل – علي حسن',        code: '1500'   },
  { id: 'ib-omar',           name: 'IB – Omar Trading',      name_ar: 'وكيل – عمر للتداول',    code: '1600'   },
  { id: 'exp-transfer-comm', name: 'Transfer Commission Exp',name_ar: 'مصروف عمولة التحويل',   code: 'EXP01'  },
  { id: 'exp-gift',          name: 'Gift Expense',           name_ar: 'مصروف الهدايا',          code: 'EXP02'  },
];

// ─── Account ID → Workbook code mapping ──────────────────────────────────────

const ACCOUNT_CODE_MAP: Record<string, string> = {
  'cash-001':          '1272',
  'cash-002':          '13304',
  'bank-kt-usd':       'KT-USD',
  'bank-baraka':       '13239',
  'usdt-klaho':        '139',
  'mt5-traders':       'MT5TR',
  'mt5-agents':        'MT5AG',
  'ib-ali-hassan':     '1500',
  'ib-omar':           '1600',
  'exp-transfer-comm': 'EXP01',
  'exp-gift':          'EXP02',
};

// Maps OpModule OpType to the Arabic opType string used in the Workbook double-entry system
const OP_TYPE_WB: Record<OpType, import('@/lib/workbook').OpType> = {
  deposit:          'تعزيز',
  agent_deposit:    'تعزيز',
  withdrawal:       'سحب',
  agent_withdrawal: 'سحب',
  transfer_from:    'تحويل من',
  transfer_to:      'تحويل الى',
  expense:          'مصروف',
};

// ─── Business Logic ───────────────────────────────────────────────────────────

export function getNextStage(type: OpType, current: OpStatus): OpStatus | null {
  if (current === 'pending') {
    if (type === 'withdrawal' || type === 'agent_withdrawal') return 'execution';
    return 'verification';
  }
  if (current === 'verification') {
    if (type === 'deposit' || type === 'agent_deposit') return 'execution';
    return 'completed';
  }
  if (current === 'execution') {
    if (type === 'withdrawal' || type === 'agent_withdrawal') return 'verification';
    return 'completed';
  }
  return null;
}

export function resolveCounterAccount(mt5Number: string, settings: OpModuleSettings): OpAccount {
  const num = parseInt(mt5Number, 10);
  const isAgent = !isNaN(num) && num >= settings.agent_range_start && num <= settings.agent_range_end;
  return MOCK_ACCOUNTS.find((a) => a.id === (isAgent ? 'mt5-agents' : 'mt5-traders'))!;
}

export function isAgentAccount(mt5Number: string, settings: OpModuleSettings): boolean {
  const num = parseInt(mt5Number, 10);
  return !isNaN(num) && num >= settings.agent_range_start && num <= settings.agent_range_end;
}

export const OP_TYPE_LABEL_AR: Record<OpType, string> = {
  deposit:          'تعزيز',
  withdrawal:       'سحب',
  agent_deposit:    'تعزيز ايجنت',
  agent_withdrawal: 'سحب ايجنت',
  transfer_from:    'تحويل من',
  transfer_to:      'تحويل الى',
  expense:          'مصروف',
};

export const OP_TYPE_LABEL_EN: Record<OpType, string> = {
  deposit:          'Deposit',
  withdrawal:       'Withdrawal',
  agent_deposit:    'Agent Deposit',
  agent_withdrawal: 'Agent Withdrawal',
  transfer_from:    'Transfer From',
  transfer_to:      'Transfer To',
  expense:          'Expense',
};

export const OP_STATUS_COLORS: Record<OpStatus, string> = {
  pending:      'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  verification: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  execution:    'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
  completed:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected:     'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  trashed:      'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const _today = new Date().toISOString().slice(0, 10);
const _yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const _two = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);

const SEED_REQUESTS: OpRequest[] = [
  {
    id: 'opr-001', request_number: 'REQ-2024-0001', request_type: 'deposit',
    status: 'completed', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _two + 'T08:00:00Z', request_date: _two,
    notes_1: 'تعزيز - Account 12345', notes_2: 'إيداع نقدي',
    total_amount_usd: 1000, journal_entry_ref: 'JRN-2024-001',
    lines: [{
      id: 'ln-001-1', line_number: 1, mt5_account_number: '12345',
      account_id: 'cash-001', account_name: 'Cash – Kilis Office',
      counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
      currency: 'USD', amount_in_currency: 1000, exchange_rate: 1, amount_usd: 1000,
      payment_method_id: 'pm-cash',
    }],
    workflow: [
      { id: 'wf-001-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _two + 'T08:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-001-2', action: 'advanced', performed_by: 'موظف التشييك', performed_at: _two + 'T10:00:00Z', from_status: 'pending', to_status: 'verification', notes: 'تأكيد الاستلام' },
      { id: 'wf-001-3', action: 'advanced', performed_by: 'موظف MT5', performed_at: _two + 'T12:00:00Z', from_status: 'verification', to_status: 'execution' },
      { id: 'wf-001-4', action: 'advanced', performed_by: 'موظف MT5', performed_at: _two + 'T13:00:00Z', from_status: 'execution', to_status: 'completed' },
    ],
  },
  {
    id: 'opr-002', request_number: 'REQ-2024-0002', request_type: 'withdrawal',
    status: 'execution', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _yesterday + 'T09:00:00Z', request_date: _yesterday,
    notes_1: 'سحب - Account 67890', total_amount_usd: 500,
    lines: [{
      id: 'ln-002-1', line_number: 1, mt5_account_number: '67890',
      account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',
      counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
      currency: 'USD', amount_in_currency: 500, exchange_rate: 1, amount_usd: 500,
      payment_method_id: 'pm-bank',
    }],
    workflow: [
      { id: 'wf-002-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _yesterday + 'T09:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-002-2', action: 'advanced', performed_by: 'موظف الطلبات', performed_at: _yesterday + 'T09:30:00Z', from_status: 'pending', to_status: 'execution' },
    ],
  },
  {
    id: 'opr-003', request_number: 'REQ-2024-0003', request_type: 'agent_deposit',
    status: 'verification', source: 'app', created_by: 'نظام التطبيق',
    created_at: _yesterday + 'T11:00:00Z', request_date: _yesterday,
    notes_1: 'تعزيز ايجنت - Account 1234', total_amount_usd: 2000,
    lines: [{
      id: 'ln-003-1', line_number: 1, mt5_account_number: '1234',
      account_id: 'usdt-klaho', account_name: 'USDT – KLAHO',
      counter_account_id: 'mt5-agents', counter_account_name: 'MT5 Agents',
      currency: 'USDT', amount_in_currency: 2000, exchange_rate: 1, amount_usd: 2000,
      payment_method_id: 'pm-usdt',
    }],
    workflow: [
      { id: 'wf-003-1', action: 'created', performed_by: 'نظام التطبيق', performed_at: _yesterday + 'T11:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-003-2', action: 'advanced', performed_by: 'موظف الطلبات', performed_at: _yesterday + 'T11:30:00Z', from_status: 'pending', to_status: 'verification' },
    ],
  },
  {
    id: 'opr-004', request_number: 'REQ-2024-0004', request_type: 'deposit',
    status: 'pending', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _today + 'T08:00:00Z', request_date: _today,
    notes_1: 'تعزيز - Account 55555', notes_2: 'عميل VIP',
    total_amount_usd: 1500,
    lines: [
      {
        id: 'ln-004-1', line_number: 1, mt5_account_number: '55555',
        account_id: 'cash-001', account_name: 'Cash – Kilis Office',
        counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
        currency: 'USD', amount_in_currency: 1000, exchange_rate: 1, amount_usd: 1000,
        payment_method_id: 'pm-cash',
      },
      {
        id: 'ln-004-2', line_number: 2, mt5_account_number: '55555',
        account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',
        counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
        currency: 'USD', amount_in_currency: 500, exchange_rate: 1, amount_usd: 500,
        payment_method_id: 'pm-bank',
      },
    ],
    workflow: [{ id: 'wf-004-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _today + 'T08:00:00Z', from_status: 'pending', to_status: 'pending' }],
  },
  {
    id: 'opr-005', request_number: 'REQ-2024-0005', request_type: 'withdrawal',
    status: 'pending', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _today + 'T09:00:00Z', request_date: _today,
    notes_1: 'سحب - Account 66666', total_amount_usd: 864,
    lines: [{
      id: 'ln-005-1', line_number: 1, mt5_account_number: '66666',
      account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',
      counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
      currency: 'EUR', amount_in_currency: 800, exchange_rate: 1.08, amount_usd: 864,
      payment_method_id: 'pm-bank',
    }],
    workflow: [{ id: 'wf-005-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _today + 'T09:00:00Z', from_status: 'pending', to_status: 'pending' }],
  },
  {
    id: 'opr-006', request_number: 'REQ-2024-0006', request_type: 'transfer_from',
    status: 'verification', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _today + 'T10:00:00Z', request_date: _today,
    notes_1: 'تحويل من - Account 1500', total_amount_usd: 3000,
    lines: [{
      id: 'ln-006-1', line_number: 1, mt5_account_number: '1500',
      account_id: 'cash-001', account_name: 'Cash – Kilis Office',
      counter_account_id: 'ib-ali-hassan', counter_account_name: 'IB – Ali Hassan',
      currency: 'USD', amount_in_currency: 3000, exchange_rate: 1, amount_usd: 3000,
      payment_method_id: 'pm-cash',
    }],
    workflow: [
      { id: 'wf-006-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _today + 'T10:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-006-2', action: 'advanced', performed_by: 'موظف الطلبات', performed_at: _today + 'T10:05:00Z', from_status: 'pending', to_status: 'verification' },
    ],
  },
  {
    id: 'opr-007', request_number: 'REQ-2024-0007', request_type: 'expense',
    status: 'completed', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _yesterday + 'T14:00:00Z', request_date: _yesterday,
    notes_1: 'مصروف - Account 1600', notes_2: 'عمولة تحويل',
    total_amount_usd: 50, journal_entry_ref: 'JRN-2024-002',
    lines: [{
      id: 'ln-007-1', line_number: 1, mt5_account_number: '1600',
      account_id: 'exp-transfer-comm', account_name: 'Transfer Commission Exp',
      counter_account_id: 'ib-omar', counter_account_name: 'IB – Omar Trading',
      currency: 'USD', amount_in_currency: 50, exchange_rate: 1, amount_usd: 50,
    }],
    workflow: [
      { id: 'wf-007-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _yesterday + 'T14:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-007-2', action: 'advanced', performed_by: 'موظف الطلبات', performed_at: _yesterday + 'T14:30:00Z', from_status: 'pending', to_status: 'verification' },
      { id: 'wf-007-3', action: 'advanced', performed_by: 'موظف التشييك', performed_at: _yesterday + 'T15:00:00Z', from_status: 'verification', to_status: 'completed' },
    ],
  },
  {
    id: 'opr-008', request_number: 'REQ-2024-0008', request_type: 'agent_withdrawal',
    status: 'pending', source: 'manual', created_by: 'موظف الطلبات',
    created_at: _today + 'T11:00:00Z', request_date: _today,
    notes_1: 'سحب ايجنت - Account 1100', total_amount_usd: 1200,
    lines: [{
      id: 'ln-008-1', line_number: 1, mt5_account_number: '1100',
      account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',
      counter_account_id: 'mt5-agents', counter_account_name: 'MT5 Agents',
      currency: 'USD', amount_in_currency: 1200, exchange_rate: 1, amount_usd: 1200,
      payment_method_id: 'pm-bank',
    }],
    workflow: [{ id: 'wf-008-1', action: 'created', performed_by: 'موظف الطلبات', performed_at: _today + 'T11:00:00Z', from_status: 'pending', to_status: 'pending' }],
  },
  {
    id: 'opr-009', request_number: 'REQ-2024-0009', request_type: 'deposit',
    status: 'rejected', source: 'app', created_by: 'نظام التطبيق',
    created_at: _two + 'T15:00:00Z', request_date: _two,
    notes_1: 'تعزيز - Account 99999', total_amount_usd: 500,
    rejected_at: _two + 'T16:00:00Z', rejected_by: 'موظف التشييك',
    rejection_reason: 'بيانات الحوالة غير مطابقة',
    lines: [{
      id: 'ln-009-1', line_number: 1, mt5_account_number: '99999',
      account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',
      counter_account_id: 'mt5-traders', counter_account_name: 'MT5 Account Traders',
      currency: 'USD', amount_in_currency: 500, exchange_rate: 1, amount_usd: 500,
      payment_method_id: 'pm-bank',
    }],
    workflow: [
      { id: 'wf-009-1', action: 'created', performed_by: 'نظام التطبيق', performed_at: _two + 'T15:00:00Z', from_status: 'pending', to_status: 'pending' },
      { id: 'wf-009-2', action: 'advanced', performed_by: 'موظف الطلبات', performed_at: _two + 'T15:30:00Z', from_status: 'pending', to_status: 'verification' },
      { id: 'wf-009-3', action: 'rejected', performed_by: 'موظف التشييك', performed_at: _two + 'T16:00:00Z', from_status: 'verification', to_status: 'rejected', notes: 'بيانات الحوالة غير مطابقة' },
    ],
  },
];

const SEED_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-cash', name_ar: 'نقدية',       name_en: 'Cash',          account_id: 'cash-001',   account_name: 'Cash – Kilis Office', is_active: true },
  { id: 'pm-bank', name_ar: 'حوالة بنكية', name_en: 'Bank Transfer', account_id: 'bank-kt-usd', account_name: 'Kuveyt Turk – USD',  is_active: true },
  { id: 'pm-usdt', name_ar: 'USDT',        name_en: 'USDT',          account_id: 'usdt-klaho', account_name: 'USDT – KLAHO',        is_active: true },
];

const SEED_EXCHANGE_RATES: ExchangeRate[] = [
  { id: 'er-001', currency_code: 'USD',  rate_to_usd: 1.0,   rate_date: _today,     source: 'manual', created_by: 'admin', created_at: _today + 'T07:00:00Z' },
  { id: 'er-002', currency_code: 'EUR',  rate_to_usd: 1.08,  rate_date: _today,     source: 'manual', created_by: 'admin', created_at: _today + 'T07:00:00Z' },
  { id: 'er-003', currency_code: 'TRY',  rate_to_usd: 0.029, rate_date: _today,     source: 'manual', created_by: 'admin', created_at: _today + 'T07:00:00Z' },
  { id: 'er-004', currency_code: 'USDT', rate_to_usd: 1.0,   rate_date: _today,     source: 'manual', created_by: 'admin', created_at: _today + 'T07:00:00Z' },
  { id: 'er-005', currency_code: 'GBP',  rate_to_usd: 1.27,  rate_date: _today,     source: 'manual', created_by: 'admin', created_at: _today + 'T07:00:00Z' },
  { id: 'er-006', currency_code: 'EUR',  rate_to_usd: 1.07,  rate_date: _yesterday, source: 'manual', created_by: 'admin', created_at: _yesterday + 'T07:00:00Z' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface OpModuleState {
  requests: OpRequest[];
  paymentMethods: PaymentMethod[];
  exchangeRates: ExchangeRate[];
  settings: OpModuleSettings;
  nextSeq: number;

  // Request actions
  createRequest: (input: Omit<OpRequest, 'id' | 'request_number' | 'workflow' | 'status' | 'created_at'>) => OpRequest;
  advanceStage: (id: string, performedBy: string, notes?: string, verifiedAccountId?: string) => void;
  rejectRequest: (id: string, performedBy: string, reason: string) => void;
  trashRequest: (id: string) => void;
  addLineToRequest: (requestId: string, line: Omit<OpLine, 'id'>) => void;

  // Payment methods
  addPaymentMethod: (pm: Omit<PaymentMethod, 'id'>) => void;
  togglePaymentMethod: (id: string) => void;

  // Exchange rates
  addExchangeRate: (rate: Omit<ExchangeRate, 'id' | 'created_at'>) => void;
  getTodayRate: (currency: string) => number;

  // Settings
  updateSettings: (patch: Partial<OpModuleSettings>) => void;

  // Selectors
  getPendingCount: () => number;
  getVerificationCount: () => number;
  getExecutionCount: () => number;
  getTotalPendingCount: () => number;
  getTodayCompletedDeposits: () => number;
  getTodayCompletedWithdrawals: () => number;
}

function makeId() { return `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export const useOpModuleStore = create<OpModuleState>()(
  persist(
    (set, get) => ({
      requests: SEED_REQUESTS,
      paymentMethods: SEED_PAYMENT_METHODS,
      exchangeRates: SEED_EXCHANGE_RATES,
      settings: { wallet_mode_enabled: false, agent_range_start: 1000, agent_range_end: 1999, exchange_rate_api_url: '' },
      nextSeq: SEED_REQUESTS.length + 1,

      createRequest: (input) => {
        const state = get();
        const year = new Date().getFullYear();
        const reqNumber = `REQ-${year}-${String(state.nextSeq).padStart(4, '0')}`;
        const newReq: OpRequest = {
          ...input,
          id: makeId(),
          request_number: reqNumber,
          status: 'pending',
          created_at: new Date().toISOString(),
          workflow: [{
            id: makeId(), action: 'created',
            performed_by: input.created_by,
            performed_at: new Date().toISOString(),
            from_status: 'pending', to_status: 'pending',
          }],
        };
        set((s) => ({ requests: [newReq, ...s.requests], nextSeq: s.nextSeq + 1 }));
        return newReq;
      },

      advanceStage: (id, performedBy, notes, verifiedAccountId) => {
        set((s) => {
          const req = s.requests.find((r) => r.id === id);
          if (!req) return s;
          const nextStatus = getNextStage(req.request_type, req.status);
          if (!nextStatus) return s;

          const step: WorkflowStep = {
            id: makeId(), action: 'advanced', performed_by: performedBy,
            performed_at: new Date().toISOString(), from_status: req.status, to_status: nextStatus,
            notes, verified_account_id: verifiedAccountId,
          };

          const updates: Partial<OpRequest> = { status: nextStatus, workflow: [...req.workflow, step] };

          // When completed: post double-entry journal lines to WorkbookStore
          if (nextStatus === 'completed') {
            const jrnSeq = `JRN-${new Date().getFullYear()}-${String(s.nextSeq).padStart(3, '0')}`;
            updates.journal_entry_ref = jrnSeq;

            const wb = useWorkbookStore.getState();
            for (const line of req.lines) {
              const accountCode = ACCOUNT_CODE_MAP[line.account_id] ?? line.account_id;
              const counterCode = ACCOUNT_CODE_MAP[line.counter_account_id] ?? line.counter_account_id;
              wb.addEntry({
                date: req.request_date,
                opType: OP_TYPE_WB[req.request_type],
                amount: line.amount_usd,
                accountCode,
                counterAccountCode: counterCode,
                currency: line.currency,
                note: `${jrnSeq} – ${req.notes_1}`,
              });
            }
          }

          return { requests: s.requests.map((r) => r.id === id ? { ...r, ...updates } : r) };
        });
      },

      rejectRequest: (id, performedBy, reason) => {
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const step: WorkflowStep = {
              id: makeId(), action: 'rejected', performed_by: performedBy,
              performed_at: new Date().toISOString(), from_status: r.status, to_status: 'rejected',
              notes: reason,
            };
            return { ...r, status: 'rejected', rejected_at: new Date().toISOString(), rejected_by: performedBy, rejection_reason: reason, workflow: [...r.workflow, step] };
          }),
        }));
      },

      trashRequest: (id) => {
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id || r.status !== 'pending') return r;
            const step: WorkflowStep = { id: makeId(), action: 'trashed', performed_by: 'user', performed_at: new Date().toISOString(), from_status: 'pending', to_status: 'trashed' };
            return { ...r, status: 'trashed', workflow: [...r.workflow, step] };
          }),
        }));
      },

      addLineToRequest: (requestId, line) => {
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== requestId) return r;
            const newLine: OpLine = { ...line, id: makeId() };
            const newLines = [...r.lines, newLine];
            const total = newLines.reduce((acc, l) => acc + l.amount_usd, 0);
            return { ...r, lines: newLines, total_amount_usd: total };
          }),
        }));
      },

      addPaymentMethod: (pm) => {
        const newPm: PaymentMethod = { ...pm, id: makeId() };
        set((s) => ({ paymentMethods: [...s.paymentMethods, newPm] }));
      },

      togglePaymentMethod: (id) => {
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) => pm.id === id ? { ...pm, is_active: !pm.is_active } : pm),
        }));
      },

      addExchangeRate: (rate) => {
        const newRate: ExchangeRate = { ...rate, id: makeId(), created_at: new Date().toISOString() };
        set((s) => ({
          exchangeRates: [
            newRate,
            ...s.exchangeRates.filter((r) => !(r.currency_code === rate.currency_code && r.rate_date === rate.rate_date)),
          ],
        }));

        // Sync to WorkbookStore: USD/TRY rate history and live rate dict
        const wb = useWorkbookStore.getState();
        if (rate.currency_code === 'TRY' && rate.rate_to_usd > 0) {
          const tryPerUsd = 1 / rate.rate_to_usd;
          wb.addRate({ date: rate.rate_date, rate: tryPerUsd });
        }
        wb.setLiveRate(`USD/${rate.currency_code}`, rate.rate_to_usd);
      },

      getTodayRate: (currency) => {
        const today = new Date().toISOString().slice(0, 10);
        const rate = get().exchangeRates.find((r) => r.currency_code === currency && r.rate_date === today);
        return rate?.rate_to_usd ?? 1;
      },

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      getPendingCount: () => get().requests.filter((r) => r.status === 'pending').length,
      getVerificationCount: () => get().requests.filter((r) => r.status === 'verification').length,
      getExecutionCount: () => get().requests.filter((r) => r.status === 'execution').length,
      getTotalPendingCount: () => get().requests.filter((r) => ['pending', 'verification', 'execution'].includes(r.status)).length,

      getTodayCompletedDeposits: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().requests
          .filter((r) => r.status === 'completed' && r.request_date === today && (r.request_type === 'deposit' || r.request_type === 'agent_deposit'))
          .reduce((s, r) => s + r.total_amount_usd, 0);
      },

      getTodayCompletedWithdrawals: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().requests
          .filter((r) => r.status === 'completed' && r.request_date === today && (r.request_type === 'withdrawal' || r.request_type === 'agent_withdrawal'))
          .reduce((s, r) => s + r.total_amount_usd, 0);
      },
    }),
    {
      name: 'fx-op-module',
      partialize: (s) => ({ requests: s.requests, paymentMethods: s.paymentMethods, exchangeRates: s.exchangeRates, settings: s.settings, nextSeq: s.nextSeq }),
    },
  ),
);
