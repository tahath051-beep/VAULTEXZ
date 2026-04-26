-- ================================================
-- MIGRATION: 002_eod_lock
-- EOD processing log — acts as lock + audit trail
-- ================================================

CREATE TABLE eod_processing_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  eod_date        DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
  -- RUNNING / COMPLETED / FAILED / LOCKED
  started_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP,
  locked_at       TIMESTAMP,
  -- set at step 15 — no modifications after this
  locked_by       UUID REFERENCES users(id),
  step_results    JSONB,
  -- array of { step, name, success, recordsProcessed, errors, durationMs }
  error           TEXT,
  UNIQUE(tenant_id, eod_date)
);

CREATE INDEX idx_eod_log_tenant_date
  ON eod_processing_log(tenant_id, eod_date);
