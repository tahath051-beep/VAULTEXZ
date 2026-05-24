// Mock-data layer that mirrors the source accounting workbook.
// Real API integrations should replace these as endpoints become available.

export type Category =
  | 'funds' | 'banks' | 'clients' | 'suppliers' | 'partners'
  | 'staff' | 'revenue' | 'expenses' | 'debts' | 'platform';

export interface AccountRow {
  code: string;
  name: string;
  arabic?: string;
  category: Category;
  balance: number;
  currency?: string;
  active?: boolean;
}

// ─── Operations & Requests ───────────────────────────────────────────────────

export type RequestType =
  | 'deposit' | 'withdrawal' | 'ib_withdrawal' | 'ib_deposit'
  | 'transfer_to' | 'transfer_from' | 'expense';

export type ExpenseSubType = 'gift' | 'compensation' | 'transfer_commission';
export type RequestStatus = 'pending' | 'confirmed' | 'executed' | 'voucher';
export type RequestPriority = 'normal' | 'urgent';

export interface TimelineEvent {
  action: 'created' | 'confirmed' | 'executed' | 'voucher';
  by: string;
  at: string;
  note?: string;
}

export interface RequestLine {
  id: string;
  accountNo: string;
  accountName?: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  receivedAmount?: number;
  counterAccountCode?: string;
}

export interface OperationRequest {
  id: string;
  requestNo: number;
  type: RequestType;
  expenseSubType?: ExpenseSubType;
  date: string;
  priority: RequestPriority;
  status: RequestStatus;
  lines: RequestLine[];
  createdBy: string;
  confirmedBy?: string;
  executedBy?: string;
  voucherRef?: string;
  note?: string;
  attachmentBase64?: string;
  timeline: TimelineEvent[];
}

// ─── Client & IB Management ──────────────────────────────────────────────────

export type ClientClassification = 'good' | 'fraud' | 'bad' | 'neutral';

export interface ClientRecord {
  id: string;
  accountNo: string;
  name: string;
  arabic?: string;
  ibParentId?: string;
  classification: ClientClassification;
  treeAccountCode?: string;
  notes?: string;
  active: boolean;
  joinDate?: string;
  creditLimit?: number;
}

export type IBClassification = 'trusted' | 'hard_debt' | 'impossible_debt' | string;

export interface IBRecord {
  id: string;
  name: string;
  mt5AccountNo: string;
  treeAccountCode?: string;
  classification: IBClassification;
  active: boolean;
  linkedClientIds: string[];
  subIBIds: string[];
  commissionRate?: number;
  spreadGrant?: number;
  totalCommissionEarned?: number;
  totalCommissionPaid?: number;
  notes?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface OperationsSettings {
  requireDifferentConfirmer: boolean;
  manualMT5Execution: boolean;
  digitalWalletMode: boolean;
  urgentThresholdHours: number;
  largeTransactionThreshold: number;
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

export type AlertType =
  | 'pending_expired'
  | 'large_transaction'
  | 'negative_balance'
  | 'reconciliation_gap'
  | 'duplicate_detected';

export interface SmartAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  linkedRequestId?: string;
  linkedAccountCode?: string;
}

// Funds (الصناديق)
export const funds: AccountRow[] = [
  { code: '1272', name: 'Safi Kilis',         arabic: 'صافي كلس',         category: 'funds', balance: 25000 },
  { code: '1273', name: 'Raqqa',              arabic: 'الرقة',            category: 'funds', balance: 5100 },
  { code: '1274', name: 'Sham',               arabic: 'صندوق الشام',      category: 'funds', balance: 20000 },
  { code: '1275', name: 'Aleppo',             arabic: 'صندوق حلب',         category: 'funds', balance: 30000 },
  { code: '1276', name: 'Deir ez-Zor',        arabic: 'دير الزور',         category: 'funds', balance: 598 },
  { code: '13240', name: 'Sham Cash',         arabic: 'شام كاش',          category: 'funds', balance: 4000 },
  { code: '13201', name: 'Dollar Box',        arabic: 'صندوق دولار',       category: 'funds', balance: 155 },
  { code: '12166', name: 'Infinity',          arabic: 'انفنتي',            category: 'funds', balance: -154.87 },
  { code: '139',   name: 'USDT KLAHO',        arabic: 'USDT KLAHO',       category: 'funds', balance: 23908.58 },
  { code: '13239', name: 'BARAKA Lira',       arabic: 'بنك البركة الخال ليرة', category: 'funds', balance: 20144 },
  { code: '13304', name: 'Ankara Office',     arabic: 'صندوق مكتب انقرة',   category: 'funds', balance: -3.52 },
  { code: '1407',  name: 'Ayham Trust',       arabic: 'صندوق امانة ايهم كلاهو', category: 'funds', balance: 27004 },
];

// Banks (البنوك)
export const banks: AccountRow[] = [
  { code: 'KT-USD',  name: 'KUVEYT TURK MANAR USD', arabic: 'كويت تورك منار دولار', category: 'banks', balance: 0 },
  { code: 'AB-USD',  name: 'ALBARAKA AYHAM',        arabic: 'البركة ايهم',          category: 'banks', balance: 8000 },
  { code: 'IS-TRY',  name: 'IS BANKASI',            arabic: 'إيش بنكاسي',           category: 'banks', balance: 5000 },
  { code: 'KT-GSC',  name: 'KUVEYT TURK GSC TRY',   arabic: 'كويت تورك GSC',        category: 'banks', balance: 3000 },
  { code: 'KT-ABD',  name: 'KUVEYT TURK ABDULRAHMAN', arabic: 'كويت تورك عبد الرحمن', category: 'banks', balance: 400 },
  { code: 'KT-MNR',  name: 'KUVEYT TURK MANAR TRY', arabic: 'كويت تورك منار ليرة',  category: 'banks', balance: 300 },
  { code: 'GR-CC',   name: 'GARANTY CC',            arabic: 'غارانتي CC',           category: 'banks', balance: 0 },
  { code: 'GR',      name: 'GARANTY',               arabic: 'غارانتي',              category: 'banks', balance: 0 },
];

// Clients (الزبائن)
export const clients: AccountRow[] = [
  { code: '12166', name: 'Infinity',         arabic: 'انفنتي',         category: 'clients', balance: 3000 },
  { code: '12185', name: 'Senker',           arabic: 'سنكر',            category: 'clients', balance: 2500 },
  { code: '121102', name: 'Rimal FX',        arabic: 'ريمال',           category: 'clients', balance: 0 },
  { code: '12177', name: 'MERAKI',           arabic: 'ميراكي',          category: 'clients', balance: 0 },
  { code: '12120', name: 'Alaa GS',          arabic: 'علاء',            category: 'clients', balance: 0 },
  { code: '12188', name: 'Abu Omar',         arabic: 'ابو عمر',         category: 'clients', balance: 0 },
  { code: '12154', name: 'Mahmoud Qassar',   arabic: 'محمود قصار',      category: 'clients', balance: -100 },
  { code: '121101', name: 'Anas GS',         arabic: 'انس',             category: 'clients', balance: 6890 },
  { code: '121111', name: 'Abd-Rahman GS',   arabic: 'عبد الرحمن',      category: 'clients', balance: 0 },
  { code: '12140', name: 'Jaweesh',          arabic: 'جاويش',           category: 'clients', balance: 1000 },
  { code: '12190', name: 'M. Doumani',       arabic: 'محمد دوماني',      category: 'clients', balance: -68 },
  { code: '12196', name: 'Belshi',           arabic: 'بلشي',            category: 'clients', balance: 0 },
  { code: '12143', name: 'AbdulKarim B.',    arabic: 'عبد الكريم بدوية', category: 'clients', balance: 0 },
  { code: '121108', name: 'Abu Haitham',     arabic: 'ابو هيثم',         category: 'clients', balance: 0 },
  { code: '121110', name: 'Krupp Qais',      arabic: 'قيس',             category: 'clients', balance: -1 },
  { code: '12412', name: 'Darna Holding',    arabic: 'دارنا القابضة',   category: 'clients', balance: -20000 },
  { code: '12153', name: 'Subhi Europa',     arabic: 'صبحي اوروبا',     category: 'clients', balance: -3 },
  { code: '12157', name: 'Ankara Office',    arabic: 'مكتب انقرة - يوسف', category: 'clients', balance: -3 },
  { code: '12186', name: 'Wali',             arabic: 'الوالي',          category: 'clients', balance: 1325 },
  { code: '12199', name: 'Dabbas Aleppo',    arabic: 'حوالات دباس',     category: 'clients', balance: 7000 },
];

// Suppliers (الموردين)
export const suppliers: AccountRow[] = [
  { code: '22411', name: 'AL ARABIA',       arabic: 'العربية',         category: 'suppliers', balance: -12000 },
  { code: '12127', name: '767 $',           arabic: 'النعامة 767$',     category: 'suppliers', balance: 15000 },
  { code: '2249',  name: 'Bahu Transfers',  arabic: 'البهو حوالات',     category: 'suppliers', balance: 0 },
  { code: '2250',  name: 'Tawasol $',       arabic: 'تواصل دولار',      category: 'suppliers', balance: 36000 },
  { code: '2247',  name: 'GoldMaster',      arabic: 'غولد ماستر',       category: 'suppliers', balance: 2 },
  { code: '22429', name: 'Yaqut',           arabic: 'ياقوت',            category: 'suppliers', balance: 1300 },
  { code: '12140', name: 'Jaweesh Transfers', arabic: 'جاويش حوالات',   category: 'suppliers', balance: 0 },
  { code: '767E',  name: '767 €',           arabic: '767€',             category: 'suppliers', balance: 7499.74 },
  { code: '2413',  name: 'Bahu Euro',       arabic: 'البهو يورو',       category: 'suppliers', balance: 0 },
  { code: '2413T', name: 'Tawasol Euro',    arabic: 'تواصل يورو',       category: 'suppliers', balance: 351 },
  { code: '22429E', name: 'Yaqut Euro',     arabic: 'ياقوت يورو',       category: 'suppliers', balance: 0 },
];

// Spread revenue (إيراد السبريد)
export const revenue: AccountRow[] = [
  { code: 'SPRED01', name: 'SPRED 01',         arabic: 'سبريد 01',          category: 'revenue', balance: 0 },
  { code: 'OTHREV',  name: 'Other revenue',    arabic: 'ايرادات مختلفة',     category: 'revenue', balance: 0 },
];

// Paid expenses (المصاريف المدفوعة)
export const expenses: AccountRow[] = [
  { code: 'OFFICE-Q', name: 'Qudssia Office',   arabic: 'تاسيس مكتب قدسيا', category: 'expenses', balance: 5500 },
  { code: 'TRD',      name: 'Trading',          arabic: 'تداول متاجرة',     category: 'expenses', balance: 300 },
  { code: 'TRD-M',    name: 'Mohammed Trading', arabic: 'محمد تداول',       category: 'expenses', balance: -1000 },
  { code: 'FX-DIFF',  name: 'FX Diff Revenue',  arabic: 'ايراد فرق سعر صرف', category: 'expenses', balance: -2843 },
  { code: 'SPRD-X',   name: 'Extra Spread',     arabic: 'سبريد اضافي',      category: 'expenses', balance: 5198 },
  { code: 'MISC',     name: 'Expenses',         arabic: 'مصاريف',            category: 'expenses', balance: 150000 },
];

// Partners current accounts (جاري الشركاء)
export const partners: AccountRow[] = [
  { code: 'PART-01', name: 'Partners A/C',    arabic: 'جاري الشركاء',    category: 'partners', balance: 44000 },
];

// Payable debts (ديون مستحقة الدفع)
export const debts: AccountRow[] = [
  { code: 'COMM5',   name: 'Comm. Month 5',    arabic: 'عمولات شهر 5',       category: 'debts', balance: -19996 },
  { code: 'COMMC',   name: 'Comm. Payable',    arabic: 'عمولات مستحقة عميل', category: 'debts', balance: -2336.18 },
  { code: 'SUSP',    name: 'Suspended Acc.',   arabic: 'حسابات معلقة',       category: 'debts', balance: 0 },
  { code: 'COMM12',  name: 'Comm. Loc 12',     arabic: 'عمولات الموقع 12',   category: 'debts', balance: -395 },
  { code: 'PLT-WLT', name: 'Platform Wallets', arabic: 'محافظ المنصة',       category: 'debts', balance: -3721 },
];

// Staff loans (سلف الموظفين)
export const staff: AccountRow[] = [
  { code: 'EMP-1',  name: 'Mr. Mohammed',    arabic: 'السيد محمد',        category: 'staff', balance: 20000 },
  { code: 'EMP-2',  name: 'Mr. Ayham',       arabic: 'السيد ايهم',        category: 'staff', balance: 24000 },
  { code: 'EMP-3',  name: 'Aylaf Shawa',     arabic: 'ايلاف الشوا',       category: 'staff', balance: 0 },
  { code: 'EMP-4',  name: 'Mahmoud Babli',   arabic: 'محمود بابلي',       category: 'staff', balance: 1200 },
  { code: 'EMP-5',  name: 'Ghina Naeem',     arabic: 'غنى النعيم',        category: 'staff', balance: 200 },
  { code: 'EMP-6',  name: 'Ayham Klaho',     arabic: 'أيهم كلاهو',        category: 'staff', balance: 5000 },
  { code: 'EMP-7',  name: 'Islam Shawa',     arabic: 'اسلام الشوا',       category: 'staff', balance: 0 },
  { code: 'EMP-8',  name: 'Mohammed Humsi',  arabic: 'محمد الحمصي',       category: 'staff', balance: 700 },
  { code: 'EMP-9',  name: 'Ibrahim Awfi',    arabic: 'ابراهيم عوفي',      category: 'staff', balance: 0 },
  { code: 'EMP-10', name: 'Ahmad Qashash',   arabic: 'احمد قشاش',         category: 'staff', balance: 1000 },
  { code: 'EMP-11', name: 'Ismail Hanadi',   arabic: 'اسماعيل هنادي',     category: 'staff', balance: 200 },
  { code: 'EMP-12', name: 'Mgr. Anas',       arabic: 'المدير انس',        category: 'staff', balance: 600 },
];

// MT5 accounts
export interface MT5Account { code: string; balance: number; }
export const mt5Accounts: MT5Account[] = [
  { code: 'FOC',  balance: 109 },
  { code: 'CENT', balance: 11000 },
  { code: 'A20',  balance: 6620 },
  { code: 'A50',  balance: 5000 },
  { code: 'A80',  balance: 30000 },
  { code: 'A100', balance: 1000 },
  { code: 'BBC',  balance: 52588 },
  { code: 'A60',  balance: 300000 },
];

// Coverage (التغطية)
export const coverage = [
  { label: 'Coverage 1', arabic: 'التغطية 1', value: 23000 },
  { label: 'Coverage 2', arabic: 'التغطية 2', value: 50000 },
  { label: 'Coverage 3', arabic: 'التغطية 3', value: 0 },
  { label: 'Coverage 4', arabic: 'التغطية 4', value: 0 },
];

export function sum(rows: { balance: number }[]) {
  return rows.reduce((acc, r) => acc + (Number.isFinite(r.balance) ? r.balance : 0), 0);
}

export function categoryTotals() {
  return {
    funds:     sum(funds),
    banks:     sum(banks),
    clients:   sum(clients),
    suppliers: sum(suppliers),
    revenue:   sum(revenue),
    expenses:  sum(expenses),
    debts:     sum(debts),
    staff:     sum(staff),
    partners:  sum(partners),
  };
}

export function mt5Total() { return sum(mt5Accounts.map((a) => ({ balance: a.balance }))); }
export function coverageTotal() { return coverage.reduce((acc, c) => acc + c.value, 0); }

export function equitySummary() {
  const tot = categoryTotals();
  const blockBalance = tot.funds + tot.banks + tot.clients + tot.suppliers + tot.partners + tot.staff + tot.expenses + tot.debts;
  const curEquity = -mt5Total();
  const surplus = blockBalance + curEquity;
  const liquidMass = tot.funds + tot.banks;
  const fastLiquid = tot.banks + tot.funds * 0.7;
  const cashSavings = surplus + tot.revenue;
  return { blockBalance, curEquity, surplus, liquidMass, fastLiquid, cashSavings };
}

// Currency rates over time (USD/TRY)
export const currencyRates = [
  { date: '2026-02-18', rate: 43.78 },
  { date: '2026-02-22', rate: 43.85 },
  { date: '2026-03-04', rate: 44.0 },
  { date: '2026-03-06', rate: 44.1 },
  { date: '2026-03-17', rate: 44.2 },
  { date: '2026-03-22', rate: 44.4 },
  { date: '2026-03-23', rate: 45.0 },
  { date: '2026-03-25', rate: 45.1 },
  { date: '2026-03-27', rate: 45.0 },
  { date: '2026-04-01', rate: 44.65 },
  { date: '2026-05-02', rate: 45.1 },
  { date: '2026-05-18', rate: 45.5 },
];

// Sample entries (paired debit/credit)
export type OpType = 'تعزيز' | 'سحب' | 'تحويل من' | 'تحويل الى';
export interface EntryRow {
  ticket: number;
  date: string;
  debit: number;
  credit: number;
  account: string;
  accountCode: string;
  counterAccount: string;
  counterAccountCode: string;
  opType: OpType;
  currency: string;
  note?: string;
}

export const sampleEntries: EntryRow[] = [
  { ticket: 1, date: '2026-04-20', debit: 400, credit: 0,   account: '2249-Bahu Transfers', accountCode: '2249',  counterAccount: '1272-Safi Kilis',                      counterAccountCode: '1272',  opType: 'تحويل الى', currency: 'USD', note: 'Transfer from Safi Kilis to Bahu Transfers' },
  { ticket: 1, date: '2026-04-20', debit: 0,   credit: 400, account: '1272-Safi Kilis',     accountCode: '1272',  counterAccount: '2249-Bahu Transfers',                  counterAccountCode: '2249',  opType: 'تحويل من',  currency: 'USD', note: 'Transfer from Safi Kilis to Bahu Transfers' },
  { ticket: 2, date: '2026-04-20', debit: 100, credit: 0,   account: '13240-Sham Cash',     accountCode: '13240', counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7810' },
  { ticket: 2, date: '2026-04-20', debit: 0,   credit: 100, account: '22121-GS Capital',    accountCode: '22121', counterAccount: '13240-Sham Cash',                      counterAccountCode: '13240', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7810' },
  { ticket: 3, date: '2026-04-20', debit: 400, credit: 0,   account: '1272-Safi Kilis',     accountCode: '1272',  counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7722' },
  { ticket: 3, date: '2026-04-20', debit: 0,   credit: 400, account: '22121-GS Capital',    accountCode: '22121', counterAccount: '1272-Safi Kilis',                      counterAccountCode: '1272',  opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7722' },
  { ticket: 4, date: '2026-04-20', debit: 50,  credit: 0,   account: '13241-Khateeb Lira',  accountCode: '13241', counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7758' },
  { ticket: 4, date: '2026-04-20', debit: 0,   credit: 50,  account: '22121-GS Capital',    accountCode: '22121', counterAccount: '13241-Khateeb Lira',                   counterAccountCode: '13241', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7758' },
  { ticket: 5, date: '2026-04-20', debit: 127, credit: 0,   account: '22121-GS Capital',    accountCode: '22121', counterAccount: '13240-Sham Cash',                      counterAccountCode: '13240', opType: 'سحب',       currency: 'USD', note: 'Voucher 2689' },
  { ticket: 5, date: '2026-04-20', debit: 0,   credit: 127, account: '13240-Sham Cash',     accountCode: '13240', counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'سحب',       currency: 'USD', note: 'Voucher 2689' },
  { ticket: 6, date: '2026-04-20', debit: 400, credit: 0,   account: '12143-AbdulKarim B.', accountCode: '12143', counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7590' },
  { ticket: 6, date: '2026-04-20', debit: 0,   credit: 400, account: '22121-GS Capital',    accountCode: '22121', counterAccount: '12143-AbdulKarim B.',                  counterAccountCode: '12143', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7590' },
  { ticket: 7, date: '2026-04-20', debit: 400, credit: 0,   account: '13239-BARAKA Lira',   accountCode: '13239', counterAccount: '12143-AbdulKarim B.',                  counterAccountCode: '12143', opType: 'تحويل من',  currency: 'USD', note: 'Transfer to BARAKA' },
  { ticket: 7, date: '2026-04-20', debit: 0,   credit: 400, account: '12143-AbdulKarim B.', accountCode: '12143', counterAccount: '13239-BARAKA Lira',                    counterAccountCode: '13239', opType: 'تحويل الى', currency: 'USD', note: 'Transfer to BARAKA' },
  { ticket: 8, date: '2026-04-20', debit: 100, credit: 0,   account: '1275-Aleppo',         accountCode: '1275',  counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7709' },
  { ticket: 8, date: '2026-04-20', debit: 0,   credit: 100, account: '22121-GS Capital',    accountCode: '22121', counterAccount: '1275-Aleppo',                          counterAccountCode: '1275',  opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7709' },
  { ticket: 9, date: '2026-04-20', debit: 500, credit: 0,   account: '1275-Aleppo',         accountCode: '1275',  counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7392' },
  { ticket: 9, date: '2026-04-20', debit: 0,   credit: 500, account: '22121-GS Capital',    accountCode: '22121', counterAccount: '1275-Aleppo',                          counterAccountCode: '1275',  opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7392' },
  { ticket: 10, date: '2026-04-20', debit: 300, credit: 0,  account: '1275-Aleppo',         accountCode: '1275',  counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 6964' },
  { ticket: 10, date: '2026-04-20', debit: 0,   credit: 300, account: '22121-GS Capital',   accountCode: '22121', counterAccount: '1275-Aleppo',                          counterAccountCode: '1275',  opType: 'تعزيز',     currency: 'USD', note: 'Voucher 6964' },
  { ticket: 11, date: '2026-04-20', debit: 200, credit: 0,  account: '1273-Raqqa',          accountCode: '1273',  counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 5494' },
  { ticket: 11, date: '2026-04-20', debit: 0,   credit: 200, account: '22121-GS Capital',   accountCode: '22121', counterAccount: '1273-Raqqa',                           counterAccountCode: '1273',  opType: 'تعزيز',     currency: 'USD', note: 'Voucher 5494' },
  { ticket: 12, date: '2026-04-20', debit: 320, credit: 0,  account: '22121-GS Capital',    accountCode: '22121', counterAccount: '121101-Anas GS',                       counterAccountCode: '121101',opType: 'سحب',       currency: 'USD', note: 'Voucher 7566' },
  { ticket: 12, date: '2026-04-20', debit: 0,   credit: 320, account: '121101-Anas GS',     accountCode: '121101',counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'سحب',       currency: 'USD', note: 'Voucher 7566' },
  { ticket: 13, date: '2026-04-20', debit: 170, credit: 0,  account: '22121-GS Capital',    accountCode: '22121', counterAccount: '121101-Anas GS',                       counterAccountCode: '121101',opType: 'سحب',       currency: 'USD', note: 'Voucher 7780' },
  { ticket: 13, date: '2026-04-20', debit: 0,   credit: 170, account: '121101-Anas GS',     accountCode: '121101',counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'سحب',       currency: 'USD', note: 'Voucher 7780' },
  { ticket: 14, date: '2026-04-20', debit: 25000, credit: 0, account: '121108-Abu Haitham', accountCode: '121108',counterAccount: '22121-GS Capital deposit/withdraw',    counterAccountCode: '22121', opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7551' },
  { ticket: 14, date: '2026-04-20', debit: 0, credit: 25000, account: '22121-GS Capital',   accountCode: '22121', counterAccount: '121108-Abu Haitham',                   counterAccountCode: '121108',opType: 'تعزيز',     currency: 'USD', note: 'Voucher 7551' },
  { ticket: 15, date: '2026-04-20', debit: 25000, credit: 0, account: '4479-Goldex',        accountCode: '4479',  counterAccount: '121108-Abu Haitham',                   counterAccountCode: '121108',opType: 'تحويل من',  currency: 'USD', note: 'Transfer Abu Haitham → Goldex' },
  { ticket: 15, date: '2026-04-20', debit: 0, credit: 25000, account: '121108-Abu Haitham', accountCode: '121108',counterAccount: '4479-Goldex',                          counterAccountCode: '4479',  opType: 'تحويل الى', currency: 'USD', note: 'Transfer Abu Haitham → Goldex' },
];

// Opening balances + credit limits
export interface OpeningRow {
  code: string;
  name: string;
  arabic?: string;
  opening: number;
  creditLimit?: number;
}

export const openingBalances: OpeningRow[] = [
  { code: '12127',  name: 'Naama',           arabic: 'النعامة',          opening: 41876.75 },
  { code: '12129',  name: 'Khalid Sultan',   arabic: 'خالد ابو سلطان',   opening: 0 },
  { code: '12143',  name: 'AbdulKarim B.',   arabic: 'عبد الكريم بدوية', opening: -700 },
  { code: '12147',  name: 'Goldex',          arabic: 'غولدكس',           opening: 4000 },
  { code: '12153',  name: 'Subhi Europa',    arabic: 'صبحي اوروبا',     opening: 0,        creditLimit: 500 },
  { code: '13304',  name: 'Ankara Office',   arabic: 'صندوق مكتب انقرة', opening: 150 },
  { code: '12174',  name: 'Sherka Bayko',    arabic: 'شركة بيكو',        opening: 0,        creditLimit: 500 },
  { code: '12166',  name: 'Infinity',        arabic: 'انفنتي',           opening: -154.87,  creditLimit: 50000 },
  { code: '138',    name: 'Quainz',          arabic: 'كوينز',            opening: 0 },
  { code: '13222',  name: 'Bank Zera\'at Q.', arabic: 'بنك زراعات قشاش',  opening: 0 },
  { code: '12177',  name: 'MERAKI',          arabic: 'ميراكي',           opening: -0.4 },
  { code: '121107', name: 'Goldora',         arabic: 'غولدورا',          opening: 0 },
  { code: '12185',  name: 'Senker',          arabic: 'سنكر',             opening: 3000 },
  { code: '12186',  name: 'Wali',            arabic: 'الوالي',           opening: 1325 },
  { code: '12187',  name: 'Mu\'taz',         arabic: 'معتز اخترين',      opening: 0 },
  { code: '12188',  name: 'Abu Omar',        arabic: 'ابو عمر',          opening: 1570.32,  creditLimit: 400 },
  { code: '121110', name: 'Krupp Qais',      arabic: 'كروب قيس',         opening: -1 },
  { code: '1273',   name: 'Raqqa',           arabic: 'الرقة',            opening: 4427.61 },
  { code: '1272',   name: 'Safi Kilis',     arabic: 'صافي كلس',         opening: 24788.13, creditLimit: 7000 },
  { code: '1274',   name: 'Sham',            arabic: 'صندوق الشام',      opening: 0 },
  { code: '1275',   name: 'Aleppo',          arabic: 'صندوق حلب',         opening: 21289.88 },
  { code: '12154',  name: 'Mahmoud Qassar',  arabic: 'محمود قصار',      opening: 0 },
  { code: '121108', name: 'Abu Haitham',     arabic: 'ابو هيثم',         opening: 0 },
  { code: '121109', name: 'Markaz Shalisha', arabic: 'مركز شلشة',        opening: 0 },
  { code: '121111', name: 'Abd-Rahman GS',   arabic: 'عبد الرحمن - جي اس', opening: -5 },
];

// ─── Seed: Operation Requests ────────────────────────────────────────────────
export const seedOperationRequests: OperationRequest[] = [
  {
    id: 'req-1', requestNo: 1, type: 'deposit', priority: 'normal', status: 'voucher',
    date: '2026-05-10',
    lines: [{ id: 'l1', accountNo: '121101', accountName: 'Anas GS', amount: 500, currency: 'USD' }],
    createdBy: 'admin@demo.com', confirmedBy: 'admin@demo.com', executedBy: 'admin@demo.com',
    voucherRef: 'REQ-001-V', note: 'Monthly deposit',
    timeline: [
      { action: 'created',  by: 'admin@demo.com', at: '2026-05-10T08:00:00Z' },
      { action: 'confirmed',by: 'admin@demo.com', at: '2026-05-10T08:30:00Z' },
      { action: 'executed', by: 'admin@demo.com', at: '2026-05-10T09:00:00Z' },
      { action: 'voucher',  by: 'admin@demo.com', at: '2026-05-10T09:05:00Z' },
    ],
  },
  {
    id: 'req-2', requestNo: 2, type: 'withdrawal', priority: 'normal', status: 'executed',
    date: '2026-05-15',
    lines: [{ id: 'l2', accountNo: '12199', accountName: 'Dabbas Aleppo', amount: 1200, currency: 'USD' }],
    createdBy: 'admin@demo.com', confirmedBy: 'admin@demo.com', executedBy: 'admin@demo.com',
    timeline: [
      { action: 'created',  by: 'admin@demo.com', at: '2026-05-15T09:00:00Z' },
      { action: 'confirmed',by: 'admin@demo.com', at: '2026-05-15T09:20:00Z' },
      { action: 'executed', by: 'admin@demo.com', at: '2026-05-15T10:00:00Z' },
    ],
  },
  {
    id: 'req-3', requestNo: 3, type: 'transfer_to', priority: 'urgent', status: 'confirmed',
    date: '2026-05-20',
    lines: [
      { id: 'l3a', accountNo: '12186', accountName: 'Wali', amount: 800, currency: 'USD' },
      { id: 'l3b', accountNo: '12185', accountName: 'Senker', amount: 400, currency: 'USD' },
    ],
    createdBy: 'admin@demo.com', confirmedBy: 'admin@demo.com',
    note: 'Transfer split between two accounts',
    timeline: [
      { action: 'created',  by: 'admin@demo.com', at: '2026-05-20T07:00:00Z' },
      { action: 'confirmed',by: 'admin@demo.com', at: '2026-05-20T07:45:00Z' },
    ],
  },
  {
    id: 'req-4', requestNo: 4, type: 'ib_deposit', priority: 'normal', status: 'pending',
    date: '2026-05-22',
    lines: [{ id: 'l4', accountNo: '12140', accountName: 'Jaweesh', amount: 2500, currency: 'USD' }],
    createdBy: 'admin@demo.com',
    timeline: [
      { action: 'created', by: 'admin@demo.com', at: '2026-05-22T10:00:00Z' },
    ],
  },
  {
    id: 'req-5', requestNo: 5, type: 'expense', expenseSubType: 'compensation', priority: 'normal', status: 'pending',
    date: '2026-05-23',
    lines: [{ id: 'l5', accountNo: 'MISC', accountName: 'Expenses', amount: 150, currency: 'USD', counterAccountCode: 'MISC' }],
    createdBy: 'admin@demo.com',
    note: 'Staff compensation',
    timeline: [
      { action: 'created', by: 'admin@demo.com', at: '2026-05-23T08:00:00Z' },
    ],
  },
  {
    id: 'req-6', requestNo: 6, type: 'ib_withdrawal', priority: 'urgent', status: 'pending',
    date: '2026-05-24',
    lines: [{ id: 'l6', accountNo: '12412', accountName: 'Darna Holding', amount: 5000, currency: 'USD' }],
    createdBy: 'admin@demo.com',
    note: 'Urgent IB withdrawal request',
    timeline: [
      { action: 'created', by: 'admin@demo.com', at: '2026-05-24T06:00:00Z' },
    ],
  },
  {
    id: 'req-7', requestNo: 7, type: 'transfer_from', priority: 'normal', status: 'pending',
    date: '2026-05-24',
    lines: [{ id: 'l7', accountNo: 'AB-USD', accountName: 'ALBARAKA AYHAM', amount: 3000, currency: 'USD', exchangeRate: 45.5, receivedAmount: 136500 }],
    createdBy: 'admin@demo.com',
    note: 'Transfer from bank in TRY',
    timeline: [
      { action: 'created', by: 'admin@demo.com', at: '2026-05-24T07:30:00Z' },
    ],
  },
  {
    id: 'req-8', requestNo: 8, type: 'deposit', priority: 'normal', status: 'pending',
    date: '2026-05-24',
    lines: [{ id: 'l8', accountNo: '12177', accountName: 'MERAKI', amount: 750, currency: 'USD' }],
    createdBy: 'admin@demo.com',
    timeline: [
      { action: 'created', by: 'admin@demo.com', at: '2026-05-24T09:00:00Z' },
    ],
  },
];

// ─── Seed: Client Records ────────────────────────────────────────────────────
export const seedClientRecords: ClientRecord[] = [
  { id: 'cl-1',  accountNo: '12166', name: 'Infinity',       arabic: 'انفنتي',         classification: 'good',    active: true,  joinDate: '2025-01-15', creditLimit: 50000, ibParentId: 'ib-1' },
  { id: 'cl-2',  accountNo: '12185', name: 'Senker',         arabic: 'سنكر',           classification: 'good',    active: true,  joinDate: '2025-02-10', ibParentId: 'ib-1' },
  { id: 'cl-3',  accountNo: '121102',name: 'Rimal FX',       arabic: 'ريمال',          classification: 'neutral', active: true,  joinDate: '2025-03-05' },
  { id: 'cl-4',  accountNo: '12177', name: 'MERAKI',         arabic: 'ميراكي',         classification: 'good',    active: true,  joinDate: '2025-01-20', ibParentId: 'ib-2' },
  { id: 'cl-5',  accountNo: '12154', name: 'Mahmoud Qassar', arabic: 'محمود قصار',     classification: 'bad',     active: true,  joinDate: '2024-11-01', creditLimit: 0 },
  { id: 'cl-6',  accountNo: '121101',name: 'Anas GS',        arabic: 'انس',            classification: 'good',    active: true,  joinDate: '2025-01-05', ibParentId: 'ib-1' },
  { id: 'cl-7',  accountNo: '12140', name: 'Jaweesh',        arabic: 'جاويش',          classification: 'good',    active: true,  joinDate: '2025-04-12' },
  { id: 'cl-8',  accountNo: '12190', name: 'M. Doumani',     arabic: 'محمد دوماني',    classification: 'neutral', active: true,  joinDate: '2025-05-01' },
  { id: 'cl-9',  accountNo: '12412', name: 'Darna Holding',  arabic: 'دارنا القابضة', classification: 'bad',     active: true,  joinDate: '2024-09-15', creditLimit: 0 },
  { id: 'cl-10', accountNo: '12186', name: 'Wali',           arabic: 'الوالي',         classification: 'good',    active: true,  joinDate: '2025-02-28', ibParentId: 'ib-2' },
  { id: 'cl-11', accountNo: '12199', name: 'Dabbas Aleppo',  arabic: 'حوالات دباس',   classification: 'good',    active: true,  joinDate: '2025-03-18' },
  { id: 'cl-12', accountNo: '12153', name: 'Subhi Europa',   arabic: 'صبحي اوروبا',   classification: 'neutral', active: false, joinDate: '2024-08-01' },
];

// ─── Seed: IB Records ────────────────────────────────────────────────────────
export const seedIBRecords: IBRecord[] = [
  {
    id: 'ib-1', name: 'GS Capital', mt5AccountNo: '22121', treeAccountCode: '22121',
    classification: 'trusted', active: true,
    linkedClientIds: ['cl-1', 'cl-2', 'cl-6'],
    subIBIds: [],
    commissionRate: 3.5, spreadGrant: 0.5,
    totalCommissionEarned: 4820, totalCommissionPaid: 3200,
    notes: 'Main IB partner since 2024',
  },
  {
    id: 'ib-2', name: 'Naama Network', mt5AccountNo: '12127', treeAccountCode: '12127',
    classification: 'trusted', active: true,
    linkedClientIds: ['cl-4', 'cl-10'],
    subIBIds: [],
    commissionRate: 2.5, spreadGrant: 0.3,
    totalCommissionEarned: 1650, totalCommissionPaid: 1650,
    notes: 'Reliable partner, always pays on time',
  },
  {
    id: 'ib-3', name: 'Goldex Group', mt5AccountNo: '4479', treeAccountCode: '12147',
    classification: 'hard_debt', active: false,
    linkedClientIds: [],
    subIBIds: [],
    commissionRate: 2.0, spreadGrant: 0.2,
    totalCommissionEarned: 720, totalCommissionPaid: 200,
    notes: 'Account suspended - pending debt collection',
  },
];

// ─── Seed: Smart Alerts ──────────────────────────────────────────────────────
export const seedAlerts: SmartAlert[] = [
  {
    id: 'alt-1', type: 'pending_expired', severity: 'warning',
    title: 'Pending Request Overdue',
    body: 'Request REQ-006 (IB Withdrawal $5,000) has been pending for over 4 hours.',
    createdAt: '2026-05-24T10:00:00Z', read: false, linkedRequestId: 'req-6',
  },
  {
    id: 'alt-2', type: 'large_transaction', severity: 'info',
    title: 'Large Transaction Detected',
    body: 'Request REQ-006 exceeds the $10,000 threshold. Please verify.',
    createdAt: '2026-05-24T06:00:00Z', read: false, linkedRequestId: 'req-6',
  },
  {
    id: 'alt-3', type: 'negative_balance', severity: 'critical',
    title: 'Negative Client Balance',
    body: 'Client Darna Holding (12412) has a negative balance of -$20,000.',
    createdAt: '2026-05-23T12:00:00Z', read: false, linkedAccountCode: '12412',
  },
  {
    id: 'alt-4', type: 'reconciliation_gap', severity: 'warning',
    title: 'Reconciliation Gap Detected',
    body: 'MT5 equity vs book equity gap is 4.2%. Review the reconciliation dashboard.',
    createdAt: '2026-05-24T08:00:00Z', read: true,
  },
  {
    id: 'alt-5', type: 'negative_balance', severity: 'warning',
    title: 'Negative Client Balance',
    body: 'Client Mahmoud Qassar (12154) has a negative balance of -$100.',
    createdAt: '2026-05-22T15:00:00Z', read: true, linkedAccountCode: '12154',
  },
];

// Vouchers — sequential receipts per account
export interface VoucherSeries {
  accountCode: string;
  accountName: string;
  vouchers: number[];
}
export const voucherSeries: VoucherSeries[] = [
  { accountCode: '12127',  accountName: 'Naama',          vouchers: [1520, 1541, 2889, 3306, 2712, 2725, 2947, 3266, 3754] },
  { accountCode: '12129',  accountName: 'Khalid Sultan',  vouchers: [1521, 1565, 1625, 2551, 3993, 3724, 3753, 3756, 3777, 3897, 3965, 4755] },
  { accountCode: '12143',  accountName: 'AbdulKarim B.',  vouchers: [1529, 1560] },
  { accountCode: '12147',  accountName: 'Goldex',         vouchers: [1515, 1516, 1517, 1646] },
  { accountCode: '12149',  accountName: 'Ghoras Atia',    vouchers: [1569, 1598, 4084, 3992, 3092, 3117, 3459, 3526, 3574] },
  { accountCode: '12157',  accountName: 'Doctor Yousef',  vouchers: [] },
  { accountCode: '12162',  accountName: 'Bahouz',         vouchers: [] },
  { accountCode: '12166',  accountName: 'Infinity',       vouchers: [1570, 1573, 1574, 1587, 3307, 3169, 3355, 3942, 3738, 4136, 3751, 3971, 3278, 4142, 3977, 3479, 4171, 3300, 3981, 4048, 4101, 4129, 4169, 4066, 3098, 3100, 3101] },
  { accountCode: '12172',  accountName: 'Iraq Transfers', vouchers: [1593, 1594, 1595, 2490, 3186, 3187, 3196, 3198, 3223, 3255, 3256, 3349, 3350, 3368, 3480, 3485, 3527] },
  { accountCode: '12174',  accountName: 'Sherka Bayko',   vouchers: [1606, 1608, 1620, 3707, 3534, 3530, 3531, 3532, 3557, 3581, 3609, 3617, 3659, 3673, 3677, 3708, 3710, 3719, 3721, 3769, 3829, 3957, 3961, 3972] },
];
