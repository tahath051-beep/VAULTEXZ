-- ================================================
-- MIGRATION: 013_event_bus
-- Event-driven architecture: events + subscriptions
-- ================================================

CREATE TABLE platform_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  event_type      VARCHAR(100) NOT NULL,
  -- DepositApproved / WithdrawalApproved / FundingCompleted
  -- CommissionGenerated / AccountCreated / KYCApproved
  -- WorkflowCompleted / PaymentRejected / etc.
  payload         JSONB NOT NULL,
  reference_id    UUID,
  reference_type  VARCHAR(100),
  triggered_by    UUID REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / PROCESSING / COMPLETED / FAILED
  processed_at    TIMESTAMP,
  error_message   TEXT,
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type      VARCHAR(100) NOT NULL,
  -- which event to listen to (or '*' for all)
  handler_type    VARCHAR(50) NOT NULL,
  -- WORKFLOW / NOTIFICATION / ACCOUNTING / WEBHOOK / AUDIT
  handler_config  JSONB,
  -- e.g. { "workflow_template_id": "...", "url": "..." }
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_processing_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID REFERENCES platform_events(id),
  subscription_id   UUID REFERENCES event_subscriptions(id),
  status            VARCHAR(20) NOT NULL,
  -- SUCCESS / FAILED / SKIPPED
  duration_ms       INTEGER,
  error_message     TEXT,
  processed_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_tenant_type   ON platform_events(tenant_id, event_type);
CREATE INDEX idx_events_pending       ON platform_events(status, created_at) WHERE status = 'PENDING';
CREATE INDEX idx_event_subs_type      ON event_subscriptions(event_type) WHERE is_active = true;
