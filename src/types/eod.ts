import type { PoolClient } from 'pg';

export interface EODJobData {
  tenantId: string;
  eodDate: string;       // 'YYYY-MM-DD'
  triggeredBy: string;   // userId or 'system'
}

export interface EODContext {
  tenantId: string;
  eodDate: string;
  db: PoolClient;
}

export interface StepResult {
  step: number;
  name: string;
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  durationMs: number;
}

export interface EODResult {
  tenantId: string;
  eodDate: string;
  steps: StepResult[];
  totalDurationMs: number;
  success: boolean;
}

// Symbol config loaded at EOD for calculations
export interface SymbolConfigRow {
  id: string;
  symbol: string;
  pip_value_usd: string;
  broker_spread: string;
  lp_spread: string;
  markup_spread: string;
  contract_size: number;
  asset_class: string | null;
}

// Trade row as loaded from DB for EOD processing
export interface TradeRow {
  id: string;
  tenant_id: string;
  mt5_account_id: string;
  mt5_ticket: number;
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: string;
  open_price: string;
  close_price: string;
  close_time: Date;
  mt5_profit: string;
  swap: string;
  commission: string;
  book_type: 'A' | 'B';
  spread_income: string | null;
  lp_cost: string | null;
  bbook_pnl: string | null;
  net_broker_pnl: string | null;
  journal_posted: boolean;
}

export interface IBCommissionCalc {
  ibId: string;
  ibLevel: number;
  commissionType: 'PER_LOT' | 'SPREAD_SHARE' | 'FLAT_FEE';
  rate: number;
  grossAmount: number;
  currency: string;
}
