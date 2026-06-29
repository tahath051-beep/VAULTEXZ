-- ================================================
-- MIGRATION: 004_workflow_engine
-- Configurable workflow engine per tenant
-- ================================================

CREATE TABLE workflow_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  process_type  VARCHAR(100) NOT NULL,
  -- DEPOSIT / WITHDRAWAL / TRANSFER / KYC / ACCOUNT_CREATION
  -- IB_PAYOUT / COMPENSATION / MANUAL_JOURNAL / EXPENSE
  description   TEXT,
  sla_hours     INTEGER DEFAULT 24,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, process_type)
);

CREATE TABLE workflow_stages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       UUID REFERENCES workflow_templates(id) ON DELETE CASCADE,
  tenant_id         UUID REFERENCES tenants(id),
  stage_order       INTEGER NOT NULL,
  name              VARCHAR(255) NOT NULL,
  stage_type        VARCHAR(50) NOT NULL,
  -- APPROVAL / REVIEW / AUTOMATED / NOTIFICATION / CLOSE
  assigned_role_id  UUID REFERENCES roles(id),
  required_approval_count INTEGER DEFAULT 1,
  sla_hours         INTEGER,
  on_approve_next   INTEGER, -- stage_order of next stage on approve
  on_reject_next    INTEGER, -- stage_order on reject (NULL = terminate)
  auto_action       VARCHAR(100),
  -- e.g. FUND_MT5 / POST_JOURNAL / SEND_EMAIL
  UNIQUE(template_id, stage_order)
);

CREATE TABLE workflow_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  template_id     UUID REFERENCES workflow_templates(id),
  process_type    VARCHAR(100) NOT NULL,
  reference_id    UUID NOT NULL,
  -- ID of the payment, withdrawal request, etc.
  reference_type  VARCHAR(100) NOT NULL,
  current_stage   INTEGER NOT NULL DEFAULT 1,
  status          VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
  -- IN_PROGRESS / COMPLETED / REJECTED / CANCELLED / ESCALATED
  initiated_by    UUID REFERENCES users(id),
  completed_at    TIMESTAMP,
  due_at          TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  instance_id     UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  stage_id        UUID REFERENCES workflow_stages(id),
  stage_order     INTEGER NOT NULL,
  assigned_to     UUID REFERENCES users(id),
  assigned_role   UUID REFERENCES roles(id),
  status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  -- PENDING / IN_PROGRESS / APPROVED / REJECTED / SKIPPED
  action_taken    VARCHAR(30),
  action_comment  TEXT,
  action_by       UUID REFERENCES users(id),
  action_at       TIMESTAMP,
  due_at          TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_escalations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  instance_id     UUID REFERENCES workflow_instances(id),
  task_id         UUID REFERENCES workflow_tasks(id),
  escalated_to    UUID REFERENCES users(id),
  reason          TEXT,
  resolved        BOOLEAN DEFAULT false,
  resolved_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_instances_ref    ON workflow_instances(reference_id, reference_type);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(tenant_id, status);
CREATE INDEX idx_workflow_tasks_assigned   ON workflow_tasks(assigned_to, status);
CREATE INDEX idx_workflow_tasks_instance   ON workflow_tasks(instance_id);
