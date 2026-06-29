-- ================================================
-- MIGRATION: 008_treasury
-- Banks, cash, payment providers, internal transfers
-- ================================================

CREATE TABLE banks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  swift_code    VARCHAR(20),
  country       CHAR(2),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  bank_id         UUID REFERENCES banks(id),
  account_name    VARCHAR(255) NOT NULL,
  account_number  VARCHAR(100) NOT NULL,
  iban            VARCHAR(50),
  currency        CHAR(3) NOT NULL,
  current_balance DECIMAL(18,6) DEFAULT 0,
  gl_account_id   UUID REFERENCES chart_of_accounts(id),
  -- linked GL account for auto journal
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  provider_type   VARCHAR(50) NOT NULL,
  -- BANK_WIRE / CARD / CRYPTO / EWALLET / LOCAL
  currencies      TEXT[],
  -- supported currencies
  fee_percent     DECIMAL(6,4) DEFAULT 0,
  fee_fixed       DECIMAL(18,6) DEFAULT 0,
  gl_account_id   UUID REFERENCES chart_of_accounts(id),
  config          JSONB,
  -- API keys, endpoints (encrypted at app layer)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cash_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  currency        CHAR(3) NOT NULL,
  current_balance DECIMAL(18,6) DEFAULT 0,
  gl_account_id   UUID REFERENCES chart_of_accounts(id),
  branch_id       UUID REFERENCES branches(id),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE internal_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  transfer_type   VARCHAR(50) NOT NULL,
  -- BANK_TO_BANK / BANK_TO_CASH / CASH_TO_BANK / PROVIDER_TO_BANK
  from_account_id UUID NOT NULL,
  from_type       VARCHAR(30) NOT NULL,
  -- BANK_ACCOUNT / CASH_ACCOUNT / PAYMENT_PROVIDER
  to_account_id   UUID NOT NULL,
  to_type         VARCHAR(30) NOT NULL,
  amount          DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) NOT NULL,
  exchange_rate   DECIMAL(18,8) DEFAULT 1,
  amount_base     DECIMAL(18,6),
  fee             DECIMAL(18,6) DEFAULT 0,
  reference       VARCHAR(255),
  status          VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING / APPROVED / COMPLETED / REJECTED
  journal_id      UUID REFERENCES journal_entries(id),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  narration       TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bank_reconciliations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  recon_date      DATE NOT NULL,
  statement_balance DECIMAL(18,6) NOT NULL,
  system_balance    DECIMAL(18,6) NOT NULL,
  difference        DECIMAL(18,6) GENERATED ALWAYS AS (statement_balance - system_balance) STORED,
  status          VARCHAR(30) DEFAULT 'OPEN',
  -- OPEN / RECONCILED / BREAK
  notes           TEXT,
  reconciled_by   UUID REFERENCES users(id),
  reconciled_at   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, bank_account_id, recon_date)
);

CREATE INDEX idx_bank_accounts_tenant     ON bank_accounts(tenant_id);
CREATE INDEX idx_internal_transfers_status ON internal_transfers(tenant_id, status);
