-- ================================================
-- MIGRATION: 010_fixed_assets
-- Asset register, depreciation, maintenance
-- ================================================

CREATE TABLE asset_categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  depreciation_method VARCHAR(30) DEFAULT 'STRAIGHT_LINE',
  -- STRAIGHT_LINE / DECLINING_BALANCE / UNITS_OF_PRODUCTION
  useful_life_years INTEGER NOT NULL,
  salvage_percent   DECIMAL(5,2) DEFAULT 0,
  gl_asset_account  UUID REFERENCES chart_of_accounts(id),
  gl_depreciation_account UUID REFERENCES chart_of_accounts(id),
  gl_accum_depr_account   UUID REFERENCES chart_of_accounts(id),
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fixed_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_code        VARCHAR(50) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  category_id       UUID REFERENCES asset_categories(id),
  branch_id         UUID REFERENCES branches(id),
  department_id     UUID REFERENCES departments(id),
  purchase_date     DATE NOT NULL,
  purchase_cost     DECIMAL(18,6) NOT NULL,
  currency          CHAR(3) DEFAULT 'USD',
  salvage_value     DECIMAL(18,6) DEFAULT 0,
  useful_life_years INTEGER NOT NULL,
  depreciation_method VARCHAR(30) DEFAULT 'STRAIGHT_LINE',
  current_book_value  DECIMAL(18,6),
  accumulated_depreciation DECIMAL(18,6) DEFAULT 0,
  status            VARCHAR(30) DEFAULT 'ACTIVE',
  -- ACTIVE / DISPOSED / FULLY_DEPRECIATED / UNDER_MAINTENANCE
  location          VARCHAR(255),
  serial_number     VARCHAR(255),
  supplier          VARCHAR(255),
  warranty_expires  DATE,
  disposed_at       DATE,
  disposal_proceeds DECIMAL(18,6),
  disposal_journal_id UUID REFERENCES journal_entries(id),
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, asset_code)
);

CREATE TABLE asset_depreciation_schedule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  asset_id        UUID REFERENCES fixed_assets(id) ON DELETE CASCADE,
  period_year     SMALLINT NOT NULL,
  period_month    SMALLINT NOT NULL,
  depreciation_amount DECIMAL(18,6) NOT NULL,
  book_value_after    DECIMAL(18,6) NOT NULL,
  journal_id      UUID REFERENCES journal_entries(id),
  posted          BOOLEAN DEFAULT false,
  posted_at       TIMESTAMP,
  UNIQUE(asset_id, period_year, period_month)
);

CREATE TABLE asset_maintenance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  asset_id        UUID REFERENCES fixed_assets(id),
  maintenance_type VARCHAR(50),
  -- SCHEDULED / CORRECTIVE / PREVENTIVE
  description     TEXT,
  cost            DECIMAL(18,6) DEFAULT 0,
  currency        CHAR(3) DEFAULT 'USD',
  vendor          VARCHAR(255),
  scheduled_date  DATE,
  completed_date  DATE,
  status          VARCHAR(30) DEFAULT 'SCHEDULED',
  -- SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED
  journal_id      UUID REFERENCES journal_entries(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fixed_assets_tenant  ON fixed_assets(tenant_id, status);
CREATE INDEX idx_depr_schedule_asset  ON asset_depreciation_schedule(asset_id, posted);
