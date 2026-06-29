-- ================================================
-- MIGRATION: 012_risk_management
-- Exposure monitoring, coverage, position snapshots
-- ================================================

CREATE TABLE risk_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id),
  snapshot_time     TIMESTAMP NOT NULL,
  symbol            VARCHAR(20) NOT NULL,
  total_buy_lots    DECIMAL(18,6) DEFAULT 0,
  total_sell_lots   DECIMAL(18,6) DEFAULT 0,
  net_exposure_lots DECIMAL(18,6) GENERATED ALWAYS AS (total_buy_lots - total_sell_lots) STORED,
  abook_buy_lots    DECIMAL(18,6) DEFAULT 0,
  abook_sell_lots   DECIMAL(18,6) DEFAULT 0,
  bbook_buy_lots    DECIMAL(18,6) DEFAULT 0,
  bbook_sell_lots   DECIMAL(18,6) DEFAULT 0,
  floating_pnl      DECIMAL(18,6) DEFAULT 0,
  current_price     DECIMAL(18,6),
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coverage_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  symbol          VARCHAR(20) NOT NULL,
  coverage_type   VARCHAR(10) NOT NULL,
  -- A_BOOK / HEDGE
  direction       CHAR(4) NOT NULL,
  -- BUY / SELL
  lots            DECIMAL(18,6) NOT NULL,
  open_price      DECIMAL(18,6) NOT NULL,
  close_price     DECIMAL(18,6),
  lp_name         VARCHAR(100),
  lp_ticket       VARCHAR(100),
  open_time       TIMESTAMP NOT NULL,
  close_time      TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'OPEN',
  -- OPEN / CLOSED
  pnl             DECIMAL(18,6),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE risk_limits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  symbol          VARCHAR(20),
  -- NULL = applies to all symbols
  limit_type      VARCHAR(50) NOT NULL,
  -- MAX_NET_EXPOSURE / MAX_BBOOK_EXPOSURE / MAX_CLIENT_POSITION
  limit_value     DECIMAL(18,6) NOT NULL,
  alert_pct       DECIMAL(5,2) DEFAULT 80,
  -- alert when % of limit reached
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE risk_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  limit_id        UUID REFERENCES risk_limits(id),
  alert_type      VARCHAR(50) NOT NULL,
  -- EXPOSURE_BREACH / LIMIT_NEAR / MARGIN_CALL_RISK
  symbol          VARCHAR(20),
  current_value   DECIMAL(18,6),
  limit_value     DECIMAL(18,6),
  severity        VARCHAR(20) DEFAULT 'WARNING',
  -- WARNING / CRITICAL
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_snapshots_time   ON risk_snapshots(tenant_id, snapshot_time);
CREATE INDEX idx_risk_snapshots_symbol ON risk_snapshots(tenant_id, symbol, snapshot_time);
CREATE INDEX idx_coverage_open         ON coverage_records(tenant_id, status) WHERE status = 'OPEN';
CREATE INDEX idx_risk_alerts_unack     ON risk_alerts(tenant_id, is_acknowledged) WHERE is_acknowledged = false;
