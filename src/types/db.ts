// Auto-generated from 001_initial_schema.sql
// DO NOT hand-edit — regenerate from schema

export type UUID = string;
export type Timestamp = Date;
export type DateOnly = string; // 'YYYY-MM-DD'

// ── Enums ────────────────────────────────────────────────────────────────────

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type AssetClass = 'FOREX' | 'METALS' | 'INDICES' | 'CRYPTO';
export type BookType = 'A' | 'B';
export type Direction = 'BUY' | 'SELL';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AccountTypeLabel = 'STANDARD' | 'ECN' | 'ISLAMIC';
export type CommissionType = 'PER_LOT' | 'SPREAD_SHARE' | 'FLAT_FEE';
export type IBCommissionStatus = 'PENDING' | 'LOCKED' | 'PAID';
export type PaymentType = 'DEPOSIT' | 'WITHDRAWAL';
export type PaymentSource = 'MANUAL' | 'GATEWAY';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type JournalStatus = 'POSTED';
export type CloseReason = 'NORMAL' | 'STOP_LOSS' | 'MARGIN_CALL' | 'CORRECTION';
export type FxRateSource = 'MT5' | 'MANUAL';
export type SyncJobType = 'TRADES' | 'BALANCES' | 'SWAPS' | 'COMMISSIONS';
export type SyncJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type SyncErrorType =
  | 'DUPLICATE'
  | 'MISSING_SYMBOL'
  | 'INVALID_AMOUNT'
  | 'JOURNAL_FAILED'
  | 'UNKNOWN';
export type ReconStatus = 'MATCHED' | 'BREAK' | 'INVESTIGATING';
export type ReferenceType =
  | 'TRADE_CLOSE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'SWAP'
  | 'IB_COMMISSION'
  | 'FX_REVALUATION'
  | 'NEGATIVE_BALANCE'
  | 'MANUAL'
  | 'IB_PAYOUT'
  | 'DEPOSIT_REVERSAL'
  | 'TRADE_CORRECTION'
  | 'MT5_BALANCE_ADJUSTMENT';
export type ClientLedgerEntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRADE_PNL'
  | 'SWAP'
  | 'COMMISSION'
  | 'ADJUSTMENT'
  | 'NEGATIVE_BALANCE_WRITEOFF'
  | 'WITHDRAWAL_HOLD';
export type ClientLedgerRefType = 'TRADE' | 'PAYMENT' | 'JOURNAL' | 'MT5_ADJUSTMENT';

// ── Tables ───────────────────────────────────────────────────────────────────

export interface Tenant {
  id: UUID;
  name: string;
  base_currency: string;
  mt5_server: string | null;
  mt5_login: string | null;
  mt5_password_enc: string | null;
  timezone: string;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Role {
  id: UUID;
  tenant_id: UUID;
  name: string;
  description: string | null;
  created_at: Timestamp;
}

export interface Permission {
  id: UUID;
  module: string;
  action: string;
  description: string | null;
}

export interface RolePermission {
  role_id: UUID;
  permission_id: UUID;
}

export interface User {
  id: UUID;
  tenant_id: UUID;
  role_id: UUID | null;
  email: string;
  full_name: string | null;
  password_hash: string | null;
  is_active: boolean;
  last_login: Timestamp | null;
  created_at: Timestamp;
}

export interface AuditLog {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID | null;
  action: string;
  module: string;
  record_id: UUID | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Timestamp;
}

export interface ChartOfAccount {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  normal_balance: NormalBalance;
  parent_id: UUID | null;
  is_system: boolean;
  is_active: boolean;
  created_at: Timestamp;
}

export interface SymbolConfig {
  id: UUID;
  tenant_id: UUID;
  symbol: string;
  pip_value_usd: string;
  broker_spread: string;
  lp_spread: string;
  markup_spread: string; // generated
  contract_size: number;
  asset_class: AssetClass | null;
  effective_from: DateOnly;
  effective_to: DateOnly | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface IB {
  id: UUID;
  tenant_id: UUID;
  parent_ib_id: UUID | null;
  level: number;
  ib_code: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface IBCommissionPlan {
  id: UUID;
  tenant_id: UUID;
  ib_id: UUID;
  symbol: string | null;
  commission_type: CommissionType;
  rate: string;
  currency: string;
  effective_from: DateOnly;
  effective_to: DateOnly | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Client {
  id: UUID;
  tenant_id: UUID;
  client_code: string;
  full_name: string;
  email: string | null;
  country: string | null;
  kyc_status: KycStatus;
  ib_id: UUID | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface MT5Account {
  id: UUID;
  tenant_id: UUID;
  client_id: UUID | null;
  mt5_login: number;
  account_type: AccountTypeLabel | null;
  currency: string;
  leverage: number;
  book_type: BookType;
  is_islamic: boolean;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Trade {
  id: UUID;
  tenant_id: UUID;
  mt5_account_id: UUID;
  mt5_ticket: number;
  symbol: string;
  direction: Direction;
  volume: string;
  open_price: string;
  close_price: string;
  open_time: Timestamp;
  close_time: Timestamp;
  mt5_profit: string;
  swap: string;
  commission: string;
  book_type: BookType;
  // EOD-calculated fields
  spread_income: string | null;
  lp_cost: string | null;
  bbook_pnl: string | null;
  net_broker_pnl: string | null;
  // Correction tracking
  is_correction: boolean;
  original_trade_id: UUID | null;
  close_reason: CloseReason | null;
  journal_posted: boolean;
  created_at: Timestamp;
}

export interface JournalEntry {
  id: UUID;
  tenant_id: UUID;
  entry_date: DateOnly;
  reference_type: ReferenceType;
  reference_id: UUID | null;
  narration: string;
  status: JournalStatus;
  created_by: UUID | null;
  created_at: Timestamp;
}

export interface JournalLine {
  id: UUID;
  tenant_id: UUID;
  journal_id: UUID;
  account_id: UUID;
  debit: string;
  credit: string;
  currency: string;
  narration: string | null;
}

export interface ClientLedger {
  id: UUID;
  tenant_id: UUID;
  mt5_account_id: UUID;
  entry_type: ClientLedgerEntryType;
  amount: string;
  currency: string;
  reference_id: UUID | null;
  reference_type: ClientLedgerRefType | null;
  balance_after: string;
  journal_id: UUID | null;
  narration: string | null;
  created_at: Timestamp;
}

export interface Payment {
  id: UUID;
  tenant_id: UUID;
  mt5_account_id: UUID;
  payment_type: PaymentType;
  amount: string;
  currency: string;
  amount_usd: string;
  exchange_rate: string;
  source: PaymentSource;
  gateway_name: string | null;
  gateway_ref: string | null;
  status: PaymentStatus;
  approved_by: UUID | null;
  approved_at: Timestamp | null;
  journal_id: UUID | null;
  narration: string | null;
  created_at: Timestamp;
}

export interface IBCommissionLedger {
  id: UUID;
  tenant_id: UUID;
  ib_id: UUID;
  trade_id: UUID;
  ib_level: number;
  commission_type: CommissionType;
  gross_amount: string;
  currency: string;
  status: IBCommissionStatus;
  settlement_date: DateOnly | null;
  paid_date: DateOnly | null;
  journal_id: UUID | null;
  created_at: Timestamp;
}

export interface FxRate {
  id: UUID;
  tenant_id: UUID;
  rate_date: DateOnly;
  from_currency: string;
  to_currency: string;
  rate: string;
  source: FxRateSource;
  created_at: Timestamp;
}

export interface SyncJob {
  id: UUID;
  tenant_id: UUID;
  job_type: SyncJobType;
  status: SyncJobStatus;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  records_synced: number;
  records_failed: number;
  last_mt5_ticket: number | null;
  error_log: Record<string, unknown> | null;
  created_at: Timestamp;
}

export interface SyncError {
  id: UUID;
  tenant_id: UUID;
  sync_job_id: UUID;
  mt5_ticket: number | null;
  error_type: SyncErrorType | null;
  error_message: string | null;
  raw_data: Record<string, unknown> | null;
  resolved: boolean;
  created_at: Timestamp;
}

export interface DailyReconciliation {
  id: UUID;
  tenant_id: UUID;
  recon_date: DateOnly;
  mt5_total_equity: string;
  system_total_equity: string;
  difference: string; // generated
  status: ReconStatus | null;
  break_reason: string | null;
  resolved_by: UUID | null;
  resolved_at: Timestamp | null;
  created_at: Timestamp;
}

export interface EODSnapshot {
  id: UUID;
  tenant_id: UUID;
  snapshot_date: DateOnly;
  account_id: UUID;
  closing_balance: string;
  currency: string;
  created_at: Timestamp;
}
