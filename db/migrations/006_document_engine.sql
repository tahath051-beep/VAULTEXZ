-- ================================================
-- MIGRATION: 006_document_engine
-- KYC documents, contracts, file attachments
-- ================================================

CREATE TABLE document_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  -- CLIENT / EMPLOYEE / IB / COMPANY
  is_required BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES document_categories(id),
  entity_type     VARCHAR(50) NOT NULL,
  -- CLIENT / EMPLOYEE / IB / COMPANY
  entity_id       UUID NOT NULL,
  file_name       VARCHAR(500) NOT NULL,
  file_key        TEXT NOT NULL,
  -- S3 / storage key
  file_size       INTEGER,
  mime_type       VARCHAR(100),
  status          VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING / APPROVED / REJECTED / EXPIRED
  expires_at      DATE,
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMP,
  review_notes    TEXT,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_status ON documents(tenant_id, status);
