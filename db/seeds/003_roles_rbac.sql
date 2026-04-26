-- ================================================
-- SEED: Missing permissions + Role-Permission matrix (Section 9)
-- Run after 001_permissions.sql
-- ================================================

-- Add permissions not in 001_permissions.sql
INSERT INTO permissions (module, action, description) VALUES
  ('payments',       'view',    'View payment records'),
  ('payments',       'approve', 'Approve or reject payments'),
  ('mt5_adjustment', 'approve', 'Approve MT5 balance adjustments')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- seed_tenant_rbac(tenant_id)
-- Creates the 6 default roles for a tenant and maps them to Section 9 permissions.
-- Idempotent: safe to call multiple times (ON CONFLICT DO NOTHING).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_tenant_rbac(p_tenant_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_cfo   UUID;
  v_sr    UUID;
  v_asst  UUID;
  v_ib    UUID;
  v_risk  UUID;
  v_read  UUID;
BEGIN
  -- 1. Insert default roles (skip if already exist for this tenant)
  INSERT INTO roles (tenant_id, name, description) VALUES
    (p_tenant_id, 'CFO',                'Chief Financial Officer — full system access'),
    (p_tenant_id, 'Senior_Accountant',  'Senior accountant'),
    (p_tenant_id, 'Accounts_Assistant', 'Accounts assistant'),
    (p_tenant_id, 'IB_Manager',         'Introducing broker manager'),
    (p_tenant_id, 'Risk_Manager',       'Risk and compliance officer'),
    (p_tenant_id, 'Read_Only',          'Read-only reporting access')
  ON CONFLICT DO NOTHING;

  -- 2. Resolve role IDs
  SELECT id INTO v_cfo  FROM roles WHERE tenant_id = p_tenant_id AND name = 'CFO';
  SELECT id INTO v_sr   FROM roles WHERE tenant_id = p_tenant_id AND name = 'Senior_Accountant';
  SELECT id INTO v_asst FROM roles WHERE tenant_id = p_tenant_id AND name = 'Accounts_Assistant';
  SELECT id INTO v_ib   FROM roles WHERE tenant_id = p_tenant_id AND name = 'IB_Manager';
  SELECT id INTO v_risk FROM roles WHERE tenant_id = p_tenant_id AND name = 'Risk_Manager';
  SELECT id INTO v_read FROM roles WHERE tenant_id = p_tenant_id AND name = 'Read_Only';

  -- 3. CFO — all permissions from Section 9 matrix
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_cfo, id FROM permissions
    WHERE (module, action) IN (
      ('client_ledger',     'view'),
      ('client_ledger',     'export'),
      ('pnl_statement',     'view'),
      ('balance_sheet',     'view'),
      ('journal_entries',   'view'),
      ('journal_entries',   'create'),
      ('ib_commissions',    'view'),
      ('ib_commissions',    'approve'),
      ('lp_reconciliation', 'view'),
      ('payments',          'approve'),
      ('payments',          'view'),
      ('system_config',     'edit'),
      ('user_management',   'edit'),
      ('expense_management','view'),
      ('expense_management','create'),
      ('expense_management','approve'),
      ('mt5_adjustment',    'approve')
    )
  ON CONFLICT DO NOTHING;

  -- 4. Senior_Accountant
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_sr, id FROM permissions
    WHERE (module, action) IN (
      ('client_ledger',     'view'),
      ('client_ledger',     'export'),
      ('pnl_statement',     'view'),
      ('balance_sheet',     'view'),
      ('journal_entries',   'view'),
      ('journal_entries',   'create'),
      ('ib_commissions',    'view'),
      ('lp_reconciliation', 'view'),
      ('payments',          'approve'),
      ('payments',          'view'),
      ('expense_management','view'),
      ('expense_management','create')
    )
  ON CONFLICT DO NOTHING;

  -- 5. Accounts_Assistant
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_asst, id FROM permissions
    WHERE (module, action) IN (
      ('client_ledger',     'view'),
      ('journal_entries',   'view'),
      ('payments',          'view'),
      ('expense_management','view'),
      ('expense_management','create')
    )
  ON CONFLICT DO NOTHING;

  -- 6. IB_Manager
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_ib, id FROM permissions
    WHERE (module, action) IN (
      ('ib_commissions', 'view')
    )
  ON CONFLICT DO NOTHING;

  -- 7. Risk_Manager
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_risk, id FROM permissions
    WHERE (module, action) IN (
      ('client_ledger',     'view'),
      ('pnl_statement',     'view'),
      ('balance_sheet',     'view'),
      ('lp_reconciliation', 'view')
    )
  ON CONFLICT DO NOTHING;

  -- 8. Read_Only
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_read, id FROM permissions
    WHERE (module, action) IN (
      ('client_ledger',   'view'),
      ('pnl_statement',   'view'),
      ('balance_sheet',   'view'),
      ('journal_entries', 'view')
    )
  ON CONFLICT DO NOTHING;
END;
$$;
