import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  funds as seedFunds,
  banks as seedBanks,
  clients as seedClients,
  suppliers as seedSuppliers,
  partners as seedPartners,
  revenue as seedRevenue,
  expenses as seedExpenses,
  debts as seedDebts,
  staff as seedStaff,
  platform as seedPlatform,
  mt5Accounts as seedMt5,
  coverage as seedCoverage,
  currencyRates as seedRates,
  sampleEntries as seedEntries,
  openingBalances as seedOpening,
  voucherSeries as seedVouchers,
  type AccountRow,
  type Category,
  type EntryRow,
  type OpType,
  type OpeningRow,
  type VoucherSeries,
  type MT5Account,
} from '@/lib/workbook';

interface CurrencyRate { date: string; rate: number; }

interface WorkbookState {
  // Master data
  accounts: AccountRow[];
  mt5: MT5Account[];
  coverage: typeof seedCoverage;

  // Records
  entries: EntryRow[];
  opening: OpeningRow[];
  vouchers: VoucherSeries[];
  rates: CurrencyRate[];

  // Mutations
  addEntry: (input: {
    date: string;
    opType: OpType;
    amount: number;
    accountCode: string;
    counterAccountCode: string;
    currency: string;
    note?: string;
  }) => { ticket: number };

  addAccount: (input: { code: string; name: string; arabic?: string; category: Category; balance?: number; currency?: string }) => void;

  addOpening: (input: { code: string; name: string; arabic?: string; opening: number; creditLimit?: number }) => void;

  addVoucher: (input: { accountCode: string; voucherNumber: number }) => void;

  addRate: (input: { date: string; rate: number }) => void;

  setAccountActive: (code: string, active: boolean) => void;
  updateAccountCurrency: (code: string, currency: string) => void;
  liveRates: Record<string, number>;
  setLiveRate: (pair: string, rate: number) => void;
}

const allSeedAccounts: AccountRow[] = [
  ...seedFunds, ...seedBanks, ...seedClients, ...seedSuppliers,
  ...seedPartners, ...seedRevenue, ...seedExpenses, ...seedDebts, ...seedStaff, ...seedPlatform,
];

export const useWorkbookStore = create<WorkbookState>()(
  persist(
  (set, get) => ({
  accounts: allSeedAccounts,
  mt5: seedMt5,
  coverage: seedCoverage,

  entries: seedEntries,
  opening: seedOpening,
  vouchers: seedVouchers,
  rates: seedRates,

  addEntry: ({ date, opType, amount, accountCode, counterAccountCode, currency, note }) => {
    const state = get();
    const accountRow = state.accounts.find((a) => a.code === accountCode);
    const counterRow = state.accounts.find((a) => a.code === counterAccountCode);
    const accountLabel = accountRow ? `${accountRow.code}-${accountRow.name}` : accountCode;
    const counterLabel = counterRow ? `${counterRow.code}-${counterRow.name}` : counterAccountCode;

    const nextTicket = state.entries.reduce((mx, e) => Math.max(mx, e.ticket), 0) + 1;

    // For deposits/transfers IN: the target account is debited, counter is credited.
    // For withdrawals/transfers OUT: the target account is credited, counter is debited.
    const incoming = opType === 'تعزيز' || opType === 'تحويل الى';
    const firstDebit  = incoming ? amount : 0;
    const firstCredit = incoming ? 0 : amount;

    const row1: EntryRow = {
      ticket: nextTicket, date,
      debit: firstDebit, credit: firstCredit,
      account: accountLabel, accountCode,
      counterAccount: counterLabel, counterAccountCode,
      opType, currency, note,
    };
    const row2: EntryRow = {
      ticket: nextTicket, date,
      debit: firstCredit, credit: firstDebit,
      account: counterLabel, accountCode: counterAccountCode,
      counterAccount: accountLabel, counterAccountCode: accountCode,
      opType, currency, note,
    };

    // Update the affected account balances
    const accounts = state.accounts.map((a) => {
      if (a.code === accountCode) {
        return { ...a, balance: a.balance + (incoming ? amount : -amount) };
      }
      if (a.code === counterAccountCode) {
        return { ...a, balance: a.balance - (incoming ? amount : -amount) };
      }
      return a;
    });

    set({
      entries: [...state.entries, row1, row2],
      accounts,
    });

    return { ticket: nextTicket };
  },

  addAccount: ({ code, name, arabic, category, balance = 0, currency = 'USD' }) => {
    set((s) => ({
      accounts: [...s.accounts, { code, name, arabic, category, balance, currency }],
    }));
  },

  addOpening: ({ code, name, arabic, opening, creditLimit }) => {
    set((s) => ({
      opening: [...s.opening, { code, name, arabic, opening, creditLimit }],
    }));
  },

  addVoucher: ({ accountCode, voucherNumber }) => {
    set((s) => {
      const existing = s.vouchers.find((v) => v.accountCode === accountCode);
      if (existing) {
        return {
          vouchers: s.vouchers.map((v) =>
            v.accountCode === accountCode
              ? { ...v, vouchers: [...v.vouchers, voucherNumber] }
              : v,
          ),
        };
      }
      const acct = s.accounts.find((a) => a.code === accountCode);
      return {
        vouchers: [
          ...s.vouchers,
          { accountCode, accountName: acct?.name ?? accountCode, vouchers: [voucherNumber] },
        ],
      };
    });
  },

  addRate: ({ date, rate }) => {
    set((s) => ({
      rates: [...s.rates, { date, rate }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  },

  liveRates: {},

  setLiveRate: (pair, rate) => {
    set((s) => ({ liveRates: { ...s.liveRates, [pair]: rate } }));
  },

  setAccountActive: (code, active) => {
    set((s) => ({
      accounts: s.accounts.map((a) => (a.code === code ? { ...a, active } : a)),
    }));
  },

  updateAccountCurrency: (code, currency) => {
    set((s) => ({
      accounts: s.accounts.map((a) => (a.code === code ? { ...a, currency } : a)),
    }));
  },
  }),
  {
    name: 'fx-workbook',
    partialize: (s) => ({
      accounts: s.accounts,
      mt5: s.mt5,
      coverage: s.coverage,
      entries: s.entries,
      opening: s.opening,
      vouchers: s.vouchers,
      rates: s.rates,
      liveRates: s.liveRates,
    }),
  },
));

// Selector helpers
export const selectByCategory = (cat: Category) => (s: WorkbookState) =>
  s.accounts.filter((a) => a.category === cat);

export const selectCategoryTotal = (cat: Category) => (s: WorkbookState) =>
  s.accounts.filter((a) => a.category === cat).reduce((acc, a) => acc + a.balance, 0);
