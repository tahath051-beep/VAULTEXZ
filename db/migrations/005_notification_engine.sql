-- ================================================
-- MIGRATION: 005_notification_engine
-- In-app, email, SMS notifications
-- ================================================

CREATE TABLE notification_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type    VARCHAR(100) NOT NULL,
  -- DEPOSIT_APPROVED / WITHDRAWAL_APPROVED / KYC_APPROVED
  -- WORKFLOW_TASK_ASSIGNED / WORKFLOW_ESCALATED / etc.
  channel       VARCHAR(20) NOT NULL,
  -- IN_APP / EMAIL / SMS
  subject       VARCHAR(500),
  body          TEXT NOT NULL,
  -- supports {{variable}} placeholders
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, event_type, channel)
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  user_id         UUID REFERENCES users(id),
  event_type      VARCHAR(100) NOT NULL,
  channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
  -- IN_APP / EMAIL / SMS
  subject         VARCHAR(500),
  body            TEXT NOT NULL,
  reference_id    UUID,
  reference_type  VARCHAR(100),
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMP,
  sent_at         TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING / SENT / FAILED / READ
  error_message   TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id, created_at);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'PENDING';
