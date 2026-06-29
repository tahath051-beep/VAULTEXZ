-- ================================================
-- MIGRATION: 007_crm
-- Leads, prospects, activities, tickets
-- ================================================

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(50),
  country         CHAR(2),
  source          VARCHAR(100),
  -- WEBSITE / REFERRAL / IB / CAMPAIGN / COLD_CALL
  ib_id           UUID REFERENCES ibs(id),
  assigned_to     UUID REFERENCES users(id),
  status          VARCHAR(50) DEFAULT 'NEW',
  -- NEW / CONTACTED / INTERESTED / NOT_INTERESTED / CONVERTED / LOST
  notes           TEXT,
  converted_at    TIMESTAMP,
  client_id       UUID REFERENCES clients(id),
  -- set when lead converts to client
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  entity_type     VARCHAR(50) NOT NULL,
  -- LEAD / CLIENT / IB
  entity_id       UUID NOT NULL,
  activity_type   VARCHAR(50) NOT NULL,
  -- CALL / EMAIL / MEETING / NOTE / TASK / WHATSAPP
  subject         VARCHAR(500),
  notes           TEXT,
  outcome         VARCHAR(100),
  scheduled_at    TIMESTAMP,
  completed_at    TIMESTAMP,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  ticket_number   VARCHAR(50) NOT NULL,
  entity_type     VARCHAR(50),
  -- CLIENT / LEAD / IB
  entity_id       UUID,
  category        VARCHAR(100),
  -- DEPOSIT / WITHDRAWAL / ACCOUNT / TECHNICAL / COMPLAINT / OTHER
  subject         VARCHAR(500) NOT NULL,
  description     TEXT,
  priority        VARCHAR(20) DEFAULT 'MEDIUM',
  -- LOW / MEDIUM / HIGH / URGENT
  status          VARCHAR(30) DEFAULT 'OPEN',
  -- OPEN / IN_PROGRESS / WAITING / RESOLVED / CLOSED
  assigned_to     UUID REFERENCES users(id),
  resolved_at     TIMESTAMP,
  closed_at       TIMESTAMP,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, ticket_number)
);

CREATE TABLE ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  ticket_id   UUID REFERENCES tickets(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  -- AGENT / CLIENT
  sender_id   UUID REFERENCES users(id),
  is_internal BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE communication_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID NOT NULL,
  channel         VARCHAR(50) NOT NULL,
  -- EMAIL / SMS / CALL / IN_APP / WHATSAPP
  direction       VARCHAR(10) NOT NULL,
  -- INBOUND / OUTBOUND
  subject         VARCHAR(500),
  body            TEXT,
  status          VARCHAR(30),
  -- SENT / DELIVERED / READ / FAILED
  external_ref    VARCHAR(255),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant_status   ON leads(tenant_id, status);
CREATE INDEX idx_leads_assigned        ON leads(assigned_to);
CREATE INDEX idx_activities_entity     ON activities(entity_type, entity_id);
CREATE INDEX idx_tickets_tenant_status ON tickets(tenant_id, status);
CREATE INDEX idx_comm_history_entity   ON communication_history(entity_type, entity_id);
