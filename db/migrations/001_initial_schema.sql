-- ================================================
-- MIGRATION: 001_initial_schema
-- SaaS Forex Brokerage Accounting System
-- ================================================

-- ================================================
-- EXTENSIONS
-- ================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- TENANTS
-- ================================================
CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  base_currency     CHAR(3) DEFAULT 'USD',
  mt5_server        VARCHAR(255),
  mt5_login         VARCHAR(100),
  mt5_password_enc  TEXT,
  timezone          VARCHAR(50) DEFAULT 'UTC',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- ROLES & PERMISSIONS (RBAC)
-- ================================================
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
-- Default roles per tenant:
-- CFO, Senior_Accountant, Accounts_Assistant,
-- IB_Manager, Risk_Manager, Read_Only

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      VARCHAR(100) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT
  -- modules: client_ledger, pnl_statement, balance_sheet,
  --          ib_commissions, lp_reconciliation,
  --          journal_entries, expense_management,
  --          user_management, system_config
  -- actions: view, create, edit, delete, approve, export
);

CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role_id       UUID REFERENCES roles(id),
  email         VARCHAR(255) UNIQUE NOT NULL,
  full_name     VARCHAR(255),
  password_hash TEXT,
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- AUDIT LOG (IMMUTABLE - NO UPDATE NO DELETE)
-- ================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  module      VARCHAR(100) NOT NULL,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  created_at  TIMESTAMP DEFAULT NOW()
);
-- RULE: No UPDATE or DELETE on this table ever

-- ================================================
-- CHART OF ACCOUNTS
-- ================================================
CREATE TABLE chart_of_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code           VARCHAR(20) NOT NULL,
  name           VARCHAR(255) NOT NULL,
  type           VARCHAR(20) NOT NULL,
  -- ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE
  subtype        VARCHAR(100),
  normal_balance CHAR(6) NOT NULL,
  -- DEBIT / CREDIT
  parent_id      UUID REFERENCES chart_of_accounts(id),
  is_system      BOOLEAN DEFAULT false,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ================================================
-- SYMBOL CONFIG
-- ================================================
CREATE TABLE symbol_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  symbol         VARCHAR(20) NOT NULL,
  pip_value_usd  DECIMAL(10,6) NOT NULL,
  broker_spread  DECIMAL(10,5) NOT NULL,
  lp_spread      DECIMAL(10,5) NOT NULL,
  markup_spread  DECIMAL(10,5) GENERATED ALWAYS AS (broker_spread - lp_spread) STORED,
  contract_size  INTEGER NOT NULL,
  asset_class    VARCHAR(50),
  -- FOREX / METALS / INDICES / CRYPTO
  effective_from DATE NOT NULL,
  effective_to   DATE,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, symbol, effective_from)
);

-- ================================================
-- IB STRUCTURE
-- ================================================
CREATE TABLE ibs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  parent_ib_id    UUID REFERENCES ibs(id),
  level           SMALLINT NOT NULL DEFAULT 1,
  ib_code         VARCHAR(50) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, ib_code),
  CONSTRAINT max_ib_level CHECK (level <= 3)
);

CREATE TABLE ib_commission_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  ib_id           UUID REFERENCES ibs(id),
  symbol          VARCHAR(20),
  commission_type VARCHAR(20) NOT NULL,
  -- PER_LOT / SPREAD_SHARE / FLAT_FEE
  rate            DECIMAL(10,6) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- CLIENTS & MT5 ACCOUNTS
-- ================================================
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_code   VARCHAR(50) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  country       CHAR(2),
  kyc_status    VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / APPROVED / REJECTED
  ib_id         UUID REFERENCES ibs(id),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, client_code)
);

CREATE TABLE mt5_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id),
  mt5_login     BIGINT NOT NULL,
  account_type  VARCHAR(50),
  -- STANDARD / ECN / ISLAMIC
  currency      CHAR(3) DEFAULT 'USD',
  leverage      INTEGER DEFAULT 100,
  book_type     CHAR(1) DEFAULT 'B',
  -- A / B
  is_islamic    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, mt5_login)
);

-- ================================================
-- TRADES (from MT5)
-- ================================================
CREATE TABLE trades (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id),
  mt5_account_id    UUID REFERENCES mt5_accounts(id),
  mt5_ticket        BIGINT NOT NULL,
  symbol            VARCHAR(20) NOT NULL,
  direction         CHAR(4) NOT NULL,
  -- BUY / SELL
  volume            DECIMAL(10,2) NOT NULL,
  open_price        DECIMAL(18,6) NOT NULL,
  close_price       DECIMAL(18,6) NOT NULL,
  open_time         TIMESTAMP NOT NULL,
  close_time        TIMESTAMP NOT NULL,
  mt5_profit        DECIMAL(18,6) NOT NULL,
  swap              DECIMAL(18,6) DEFAULT 0,
  commission        DECIMAL(18,6) DEFAULT 0,
  book_type         CHAR(1) NOT NULL,
  -- A / B

  -- Calculated by system at EOD
  spread_income     DECIMAL(18,6),
  -- markup_spread × volume × pip_value_usd
  lp_cost           DECIMAL(18,6),
  -- A-Book only: lp_spread × volume × pip_value_usd
  bbook_pnl         DECIMAL(18,6),
  -- B-Book only: mt5_profit (broker takes opposite side)
  net_broker_pnl    DECIMAL(18,6),

  is_correction     BOOLEAN DEFAULT false,
  original_trade_id UUID REFERENCES trades(id),
  close_reason      VARCHAR(50),
  -- NORMAL / STOP_LOSS / MARGIN_CALL / CORRECTION

  journal_posted    BOOLEAN DEFAULT false,
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, mt5_ticket)
);

-- ================================================
-- JOURNAL ENTRIES (Double-entry core)
-- ================================================
CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  entry_date      DATE NOT NULL,
  reference_type  VARCHAR(50) NOT NULL,
  -- TRADE_CLOSE / DEPOSIT / WITHDRAWAL / SWAP
  -- IB_COMMISSION / FX_REVALUATION / NEGATIVE_BALANCE
  -- MANUAL / IB_PAYOUT / DEPOSIT_REVERSAL
  -- TRADE_CORRECTION / MT5_BALANCE_ADJUSTMENT
  reference_id    UUID,
  narration       TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'POSTED',
  -- POSTED only — no deletion, corrections use new entry
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);
-- RULE: No UPDATE or DELETE on this table ever

CREATE TABLE journal_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  journal_id  UUID REFERENCES journal_entries(id),
  account_id  UUID REFERENCES chart_of_accounts(id),
  debit       DECIMAL(18,6) DEFAULT 0,
  credit      DECIMAL(18,6) DEFAULT 0,
  currency    CHAR(3) DEFAULT 'USD',
  narration   TEXT,
  CONSTRAINT debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR
    (credit > 0 AND debit = 0)
  )
  -- RULE: sum(debit) = sum(credit) per journal_id
  -- enforced at application layer before INSERT
);

-- ================================================
-- CLIENT LEDGER
-- ================================================
CREATE TABLE client_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  mt5_account_id  UUID REFERENCES mt5_accounts(id),
  entry_type      VARCHAR(50) NOT NULL,
  -- DEPOSIT / WITHDRAWAL / TRADE_PNL / SWAP
  -- COMMISSION / ADJUSTMENT
  -- NEGATIVE_BALANCE_WRITEOFF / WITHDRAWAL_HOLD
  amount          DECIMAL(18,6) NOT NULL,
  -- positive = credit to client, negative = debit from client
  currency        CHAR(3) DEFAULT 'USD',
  reference_id    UUID,
  reference_type  VARCHAR(50),
  -- TRADE / PAYMENT / JOURNAL / MT5_ADJUSTMENT
  balance_after   DECIMAL(18,6) NOT NULL,
  journal_id      UUID REFERENCES journal_entries(id),
  narration       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- PAYMENTS (Deposits & Withdrawals)
-- ================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  mt5_account_id  UUID REFERENCES mt5_accounts(id),
  payment_type    VARCHAR(20) NOT NULL,
  -- DEPOSIT / WITHDRAWAL
  amount          DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) NOT NULL,
  amount_usd      DECIMAL(18,6) NOT NULL,
  exchange_rate   DECIMAL(18,6) DEFAULT 1,
  source          VARCHAR(20) NOT NULL,
  -- MANUAL / GATEWAY
  gateway_name    VARCHAR(100),
  gateway_ref     VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / APPROVED / REJECTED / CANCELLED
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  journal_id      UUID REFERENCES journal_entries(id),
  narration       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- IB COMMISSION LEDGER
-- ================================================
CREATE TABLE ib_commission_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  ib_id           UUID REFERENCES ibs(id),
  trade_id        UUID REFERENCES trades(id),
  ib_level        SMALLINT NOT NULL,
  commission_type VARCHAR(20) NOT NULL,
  gross_amount    DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / LOCKED / PAID
  settlement_date DATE,
  paid_date       DATE,
  journal_id      UUID REFERENCES journal_entries(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- FX RATES (EOD rates)
-- ================================================
CREATE TABLE fx_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),
  rate_date     DATE NOT NULL,
  from_currency CHAR(3) NOT NULL,
  to_currency   CHAR(3) NOT NULL DEFAULT 'USD',
  rate          DECIMAL(18,8) NOT NULL,
  source        VARCHAR(20) DEFAULT 'MT5',
  -- MT5 / MANUAL
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, rate_date, from_currency, to_currency)
);

-- ================================================
-- MT5 SYNC
-- ================================================
CREATE TABLE sync_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  job_type        VARCHAR(50) NOT NULL,
  -- TRADES / BALANCES / SWAPS / COMMISSIONS
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / RUNNING / COMPLETED / FAILED
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  records_synced  INTEGER DEFAULT 0,
  records_failed  INTEGER DEFAULT 0,
  last_mt5_ticket BIGINT,
  error_log       JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sync_errors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),
  sync_job_id   UUID REFERENCES sync_jobs(id),
  mt5_ticket    BIGINT,
  error_type    VARCHAR(100),
  -- DUPLICATE / MISSING_SYMBOL / INVALID_AMOUNT
  -- JOURNAL_FAILED / UNKNOWN
  error_message TEXT,
  raw_data      JSONB,
  resolved      BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- DAILY RECONCILIATION
-- ================================================
CREATE TABLE daily_reconciliation (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID REFERENCES tenants(id),
  recon_date            DATE NOT NULL,
  mt5_total_equity      DECIMAL(18,6) NOT NULL,
  system_total_equity   DECIMAL(18,6) NOT NULL,
  difference            DECIMAL(18,6) GENERATED ALWAYS AS
                        (mt5_total_equity - system_total_equity) STORED,
  status                VARCHAR(20),
  -- MATCHED / BREAK / INVESTIGATING
  break_reason          TEXT,
  resolved_by           UUID REFERENCES users(id),
  resolved_at           TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, recon_date)
);

-- ================================================
-- EOD SNAPSHOTS (Balance Sheet per day)
-- ================================================
CREATE TABLE eod_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  snapshot_date   DATE NOT NULL,
  account_id      UUID REFERENCES chart_of_accounts(id),
  closing_balance DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, snapshot_date, account_id)
);

-- ================================================
-- INDEXES (Performance)
-- ================================================
CREATE INDEX idx_trades_tenant_date
  ON trades(tenant_id, close_time);

CREATE INDEX idx_trades_mt5_account
  ON trades(mt5_account_id);

CREATE INDEX idx_trades_journal_posted
  ON trades(tenant_id, journal_posted)
  WHERE journal_posted = false;

CREATE INDEX idx_client_ledger_account
  ON client_ledger(mt5_account_id, created_at);

CREATE INDEX idx_journal_lines_account
  ON journal_lines(account_id);

CREATE INDEX idx_journal_entries_date
  ON journal_entries(tenant_id, entry_date);

CREATE INDEX idx_ib_commission_status
  ON ib_commission_ledger(tenant_id, status);

CREATE INDEX idx_sync_errors_unresolved
  ON sync_errors(tenant_id, resolved)
  WHERE resolved = false;
