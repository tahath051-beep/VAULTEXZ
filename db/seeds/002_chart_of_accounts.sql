-- ================================================
-- SEED: System Chart of Accounts
-- Aligned with Section 5 journal entry rules
-- Usage: replace :tenant_id with actual UUID
-- ================================================

-- ── ASSETS ──────────────────────────────────────
INSERT INTO chart_of_accounts (tenant_id, code, name, type, subtype, normal_balance, is_system) VALUES
  (:tenant_id, '1000', 'Current Assets',              'ASSET', 'CURRENT',      'DEBIT', true),
  (:tenant_id, '1100', 'Operational Cash',            'ASSET', 'CASH',         'DEBIT', true),
  (:tenant_id, '1110', 'Operating Bank Account',      'ASSET', 'CASH',         'DEBIT', true),
  (:tenant_id, '1200', 'Segregated Client Funds',     'ASSET', 'CLIENT_FUNDS', 'DEBIT', true),
  (:tenant_id, '1210', 'Client Deposits Clearing',    'ASSET', 'CLIENT_FUNDS', 'DEBIT', true),
  (:tenant_id, '1300', 'LP Account (MT5 Margin)',     'ASSET', 'LP',           'DEBIT', true),
  (:tenant_id, '1400', 'Receivables',                 'ASSET', 'RECEIVABLE',   'DEBIT', true),
  (:tenant_id, '1410', 'IB Commission Receivable',    'ASSET', 'RECEIVABLE',   'DEBIT', true),
  (:tenant_id, '1600', 'FX Revaluation Asset',        'ASSET', 'FX_REVAL',     'DEBIT', true);

-- ── LIABILITIES ──────────────────────────────────
INSERT INTO chart_of_accounts (tenant_id, code, name, type, subtype, normal_balance, is_system) VALUES
  (:tenant_id, '2000', 'Current Liabilities',         'LIABILITY', 'CURRENT',       'CREDIT', true),
  (:tenant_id, '2100', 'Client Payable (Equity)',     'LIABILITY', 'CLIENT_EQUITY', 'CREDIT', true),
  (:tenant_id, '2110', 'Client Deposits Payable',     'LIABILITY', 'CLIENT_EQUITY', 'CREDIT', true),
  (:tenant_id, '2200', 'IB Commissions Payable',      'LIABILITY', 'IB',            'CREDIT', true),
  (:tenant_id, '2300', 'Swap Payable',                'LIABILITY', 'SWAP',          'CREDIT', true),
  (:tenant_id, '2400', 'FX Revaluation Liability',    'LIABILITY', 'FX_REVAL',      'CREDIT', true),
  (:tenant_id, '2500', 'Negative Balance Provision',  'LIABILITY', 'PROVISION',     'CREDIT', true);

-- ── EQUITY ───────────────────────────────────────
INSERT INTO chart_of_accounts (tenant_id, code, name, type, subtype, normal_balance, is_system) VALUES
  (:tenant_id, '3000', 'Equity',                      'EQUITY', NULL,        'CREDIT', true),
  (:tenant_id, '3100', 'Retained Earnings',           'EQUITY', 'RETAINED',  'CREDIT', true),
  (:tenant_id, '3200', 'Current Year Earnings',       'EQUITY', 'CURRENT',   'CREDIT', true);

-- ── REVENUE ──────────────────────────────────────
-- Spread Income A-Book (4100-4140): markup × volume × pip_value_usd
-- Spread Income B-Book (4200):      same formula, B-Book clients
-- B-Book P&L Income  (4300):        |mt5_profit| - spread_income (when client loses)
-- Commission Income  (4400):        MT5 commission charges
-- Swap Income        (4500):        positive swap charged to client
-- FX Gain            (4600):        EOD revaluation gain
INSERT INTO chart_of_accounts (tenant_id, code, name, type, subtype, normal_balance, is_system) VALUES
  (:tenant_id, '4000', 'Revenue',                     'REVENUE', NULL,         'CREDIT', true),
  (:tenant_id, '4100', 'Spread Income',               'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4110', 'Spread Income - Forex',       'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4120', 'Spread Income - Metals',      'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4130', 'Spread Income - Indices',     'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4140', 'Spread Income - Crypto',      'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4200', 'Spread Income B-Book',        'REVENUE', 'SPREAD',     'CREDIT', true),
  (:tenant_id, '4300', 'B-Book P&L Income',           'REVENUE', 'BBOOK',      'CREDIT', true),
  (:tenant_id, '4400', 'Commission Income',           'REVENUE', 'COMMISSION', 'CREDIT', true),
  (:tenant_id, '4500', 'Swap Income',                 'REVENUE', 'SWAP',       'CREDIT', true),
  (:tenant_id, '4600', 'FX Revaluation Gain',         'REVENUE', 'FX_REVAL',   'CREDIT', true);

-- ── EXPENSES ─────────────────────────────────────
-- 5100: A-Book LP hedging cost (lp_spread × volume × pip_value_usd)
-- 5200: B-Book P&L Loss       (mt5_profit when client profits)
-- 5300: Swap Expense          (negative swap paid to client)
-- 5400: IB Commission Expense (sum of all IB levels)
-- 5500: Negative Balance W/O  (write-off when client equity < 0)
-- 5600: Gateway Fees          (payment processor costs)
-- 5700: FX Revaluation Loss   (EOD revaluation loss)
-- 5800: Operating Expenses    (general OPEX)
INSERT INTO chart_of_accounts (tenant_id, code, name, type, subtype, normal_balance, is_system) VALUES
  (:tenant_id, '5000', 'Expenses',                    'EXPENSE', NULL,       'DEBIT', true),
  (:tenant_id, '5100', 'LP Hedging Cost',             'EXPENSE', 'LP_COST',  'DEBIT', true),
  (:tenant_id, '5200', 'B-Book P&L Loss',             'EXPENSE', 'BBOOK',    'DEBIT', true),
  (:tenant_id, '5300', 'Swap Expense',                'EXPENSE', 'SWAP',     'DEBIT', true),
  (:tenant_id, '5400', 'IB Commission Expense',       'EXPENSE', 'IB',       'DEBIT', true),
  (:tenant_id, '5500', 'Negative Balance Write-off',  'EXPENSE', 'NEG_BAL',  'DEBIT', true),
  (:tenant_id, '5600', 'Gateway Fees',                'EXPENSE', 'GATEWAY',  'DEBIT', true),
  (:tenant_id, '5700', 'FX Revaluation Loss',         'EXPENSE', 'FX_REVAL', 'DEBIT', true),
  (:tenant_id, '5800', 'Operating Expenses',          'EXPENSE', 'OPEX',     'DEBIT', true);
