-- ================================================
-- MIGRATION: 011_ownership
-- Shareholders, capital contributions, profit distribution
-- ================================================

CREATE TABLE shareholders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  entity_type     VARCHAR(20) DEFAULT 'INDIVIDUAL',
  -- INDIVIDUAL / COMPANY
  email           VARCHAR(255),
  nationality     CHAR(2),
  ownership_pct   DECIMAL(8,4) NOT NULL,
  -- e.g. 33.3333
  share_class     VARCHAR(50) DEFAULT 'ORDINARY',
  -- ORDINARY / PREFERENCE
  user_id         UUID REFERENCES users(id),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
  -- RULE: sum(ownership_pct) per tenant must = 100.00
  -- enforced at application layer
);

CREATE TABLE capital_contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  shareholder_id  UUID REFERENCES shareholders(id),
  contribution_date DATE NOT NULL,
  amount          DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) NOT NULL,
  amount_base     DECIMAL(18,6) NOT NULL,
  exchange_rate   DECIMAL(18,8) DEFAULT 1,
  contribution_type VARCHAR(50),
  -- INITIAL / ADDITIONAL / IN_KIND
  description     TEXT,
  journal_id      UUID REFERENCES journal_entries(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profit_distributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  period_year     SMALLINT NOT NULL,
  period_month    SMALLINT,
  -- NULL = annual distribution
  total_profit    DECIMAL(18,6) NOT NULL,
  distributable   DECIMAL(18,6) NOT NULL,
  -- after retaining earnings
  retained        DECIMAL(18,6) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'DRAFT',
  -- DRAFT / APPROVED / PAID
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  journal_id      UUID REFERENCES journal_entries(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profit_distribution_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id),
  distribution_id     UUID REFERENCES profit_distributions(id) ON DELETE CASCADE,
  shareholder_id      UUID REFERENCES shareholders(id),
  ownership_pct       DECIMAL(8,4) NOT NULL,
  -- snapshot of % at time of distribution
  amount              DECIMAL(18,6) NOT NULL,
  currency            CHAR(3) DEFAULT 'USD',
  payment_status      VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / PAID
  paid_at             TIMESTAMP,
  bank_reference      VARCHAR(255)
);

CREATE INDEX idx_shareholders_tenant   ON shareholders(tenant_id);
CREATE INDEX idx_profit_dist_tenant    ON profit_distributions(tenant_id, status);
