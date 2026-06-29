-- ================================================
-- MIGRATION: 003_foundation_fixes
-- Multi-role users, org structure, wallets
-- ================================================

-- ================================================
-- MULTI-ROLE PER USER (replaces single role_id FK)
-- ================================================
CREATE TABLE user_roles (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ================================================
-- ORG STRUCTURE: BRANCHES & DEPARTMENTS
-- ================================================
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  country     CHAR(2),
  city        VARCHAR(100),
  address     TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Link users to branches & departments
ALTER TABLE users ADD COLUMN branch_id     UUID REFERENCES branches(id);
ALTER TABLE users ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE users ADD COLUMN approval_limit DECIMAL(18,6) DEFAULT 0;

-- ================================================
-- WALLETS (client wallet balance, separate from trading accounts)
-- ================================================
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  balance         DECIMAL(18,6) NOT NULL DEFAULT 0,
  locked_balance  DECIMAL(18,6) NOT NULL DEFAULT 0,
  -- funds held pending withdrawal approval
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, client_id, currency)
);

CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  wallet_id       UUID REFERENCES wallets(id),
  type            VARCHAR(50) NOT NULL,
  -- DEPOSIT / WITHDRAWAL / TRANSFER_IN / TRANSFER_OUT
  -- FUND_TRADING / WITHDRAW_TRADING / FEE / ADJUSTMENT
  amount          DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) NOT NULL,
  balance_after   DECIMAL(18,6) NOT NULL,
  reference_id    UUID,
  reference_type  VARCHAR(50),
  narration       TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_client    ON wallets(client_id);
CREATE INDEX idx_wallet_txn_wallet ON wallet_transactions(wallet_id, created_at);
