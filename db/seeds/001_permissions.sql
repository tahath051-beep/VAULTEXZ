-- ================================================
-- SEED: Default Permissions Matrix
-- ================================================

INSERT INTO permissions (module, action, description) VALUES
  -- client_ledger
  ('client_ledger',     'view',    'View client ledger entries'),
  ('client_ledger',     'create',  'Create client ledger entries'),
  ('client_ledger',     'export',  'Export client ledger'),

  -- pnl_statement
  ('pnl_statement',     'view',    'View P&L statements'),
  ('pnl_statement',     'export',  'Export P&L statements'),

  -- balance_sheet
  ('balance_sheet',     'view',    'View balance sheet'),
  ('balance_sheet',     'export',  'Export balance sheet'),

  -- ib_commissions
  ('ib_commissions',    'view',    'View IB commissions'),
  ('ib_commissions',    'create',  'Create IB commission entries'),
  ('ib_commissions',    'approve', 'Approve IB payouts'),
  ('ib_commissions',    'export',  'Export IB commissions'),

  -- lp_reconciliation
  ('lp_reconciliation', 'view',    'View LP reconciliation'),
  ('lp_reconciliation', 'create',  'Create reconciliation entries'),

  -- journal_entries
  ('journal_entries',   'view',    'View journal entries'),
  ('journal_entries',   'create',  'Create manual journal entries'),
  ('journal_entries',   'approve', 'Approve journal entries'),
  ('journal_entries',   'export',  'Export journal entries'),

  -- expense_management
  ('expense_management','view',    'View expenses'),
  ('expense_management','create',  'Create expense entries'),
  ('expense_management','approve', 'Approve expenses'),

  -- user_management
  ('user_management',   'view',    'View users'),
  ('user_management',   'create',  'Create users'),
  ('user_management',   'edit',    'Edit users'),
  ('user_management',   'delete',  'Deactivate users'),

  -- system_config
  ('system_config',     'view',    'View system configuration'),
  ('system_config',     'edit',    'Edit system configuration');
