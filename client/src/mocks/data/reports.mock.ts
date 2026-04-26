export const mockPnL = {
  revenue: [
    { account_id: 'coa-4110', account_code: '4110', account_name: 'Spread Income - Forex',    balance: '18420.00' },
    { account_id: 'coa-4120', account_code: '4120', account_name: 'Spread Income - Metals',   balance:  '4850.00' },
    { account_id: 'coa-4200', account_code: '4200', account_name: 'Spread Income B-Book',     balance:  '2340.00' },
    { account_id: 'coa-4300', account_code: '4300', account_name: 'B-Book P&L Income',        balance:  '6820.00' },
    { account_id: 'coa-4400', account_code: '4400', account_name: 'Commission Income',        balance:  '1250.00' },
    { account_id: 'coa-4500', account_code: '4500', account_name: 'Swap Income',              balance:   '380.00' },
  ],
  expenses: [
    { account_id: 'coa-5100', account_code: '5100', account_name: 'LP Hedging Cost',          balance:  '9210.00' },
    { account_id: 'coa-5200', account_code: '5200', account_name: 'B-Book P&L Loss',          balance:  '2050.00' },
    { account_id: 'coa-5300', account_code: '5300', account_name: 'Swap Expense',             balance:   '640.00' },
    { account_id: 'coa-5400', account_code: '5400', account_name: 'IB Commission Expense',    balance:  '1840.00' },
    { account_id: 'coa-5600', account_code: '5600', account_name: 'Gateway Fees',             balance:   '320.00' },
    { account_id: 'coa-5800', account_code: '5800', account_name: 'Operating Expenses',       balance:  '2100.00' },
  ],
  totalRevenue: '34060.00',
  totalExpenses: '16160.00',
  netPnL: '17900.00',
};

export const mockBalanceSheet = {
  assets: [
    { account_id: 'coa-1110', account_code: '1110', account_name: 'Operating Bank Account',     type: 'ASSET', balance: '128500.00' },
    { account_id: 'coa-1200', account_code: '1200', account_name: 'Segregated Client Funds',    type: 'ASSET', balance: '107670.50' },
    { account_id: 'coa-1300', account_code: '1300', account_name: 'LP Account (MT5 Margin)',    type: 'ASSET', balance:  '45200.00' },
    { account_id: 'coa-1410', account_code: '1410', account_name: 'IB Commission Receivable',   type: 'ASSET', balance:   '3400.00' },
  ],
  liabilities: [
    { account_id: 'coa-2100', account_code: '2100', account_name: 'Client Payable (Equity)',    type: 'LIABILITY', balance: '107670.50' },
    { account_id: 'coa-2200', account_code: '2200', account_name: 'IB Commissions Payable',     type: 'LIABILITY', balance:   '1840.00' },
    { account_id: 'coa-2300', account_code: '2300', account_name: 'Swap Payable',               type: 'LIABILITY', balance:    '640.00' },
  ],
  equity: [
    { account_id: 'coa-3100', account_code: '3100', account_name: 'Retained Earnings',          type: 'EQUITY', balance:  '51049.50' },
    { account_id: 'coa-3200', account_code: '3200', account_name: 'Current Year Earnings',      type: 'EQUITY', balance:  '17900.00' },
  ],
  totalAssets:      '284770.50',
  totalLiabilities: '110150.50',
  totalEquity:       '68949.50',
};

export const mockLedger = {
  entries: [
    { id: 'led-001', entry_type: 'DEPOSIT',    amount: '10000.00', currency: 'USD', balance_after: '10000.00', narration: 'Wire WT-2025-0401',      created_at: '2025-04-01T09:05:00Z', mt5_login: 1000101, client_name: 'James Harrington' },
    { id: 'led-002', entry_type: 'DEPOSIT',    amount: '25000.00', currency: 'USD', balance_after: '25000.00', narration: 'SWIFT SW-2025-0402',     created_at: '2025-04-02T11:35:00Z', mt5_login: 1000201, client_name: 'Sophia Chen' },
    { id: 'led-003', entry_type: 'WITHDRAWAL', amount:  '5000.00', currency: 'USD', balance_after: '19890.00', narration: 'Withdrawal WD-2025-0403', created_at: '2025-04-05T14:05:00Z', mt5_login: 1000101, client_name: 'James Harrington' },
    { id: 'led-004', entry_type: 'DEPOSIT',    amount:  '3000.00', currency: 'USD', balance_after:  '3000.00', narration: 'Crypto CR-2025-0404',     created_at: '2025-04-04T10:20:00Z', mt5_login: 1000301, client_name: 'Marcus Okafor' },
    { id: 'led-005', entry_type: 'DEPOSIT',    amount: '15000.00', currency: 'USD', balance_after: '15000.00', narration: 'Wire WT-2025-0405',      created_at: '2025-04-05T09:50:00Z', mt5_login: 1000401, client_name: 'Elena Vasquez' },
    { id: 'led-006', entry_type: 'TRADE_PNL',  amount:   '940.00', currency: 'USD', balance_after: '20940.00', narration: 'EURUSD BUY 2.0L profit', created_at: '2025-04-01T17:10:00Z', mt5_login: 1000101, client_name: 'James Harrington' },
    { id: 'led-007', entry_type: 'TRADE_PNL',  amount: '-1250.00', currency: 'USD', balance_after:  '7640.00', narration: 'XAUUSD BUY 0.5L loss',  created_at: '2025-04-02T16:10:00Z', mt5_login: 1000102, client_name: 'James Harrington' },
    { id: 'led-008', entry_type: 'TRADE_PNL',  amount:  '2250.00', currency: 'USD', balance_after: '27250.00', narration: 'EURUSD SELL 5.0L profit',created_at: '2025-04-03T10:10:00Z', mt5_login: 1000201, client_name: 'Sophia Chen' },
    { id: 'led-009', entry_type: 'WITHDRAWAL', amount: '10000.00', currency: 'USD', balance_after: '42990.00', narration: 'Profit withdrawal',       created_at: '2025-04-08T15:05:00Z', mt5_login: 1000201, client_name: 'Sophia Chen' },
    { id: 'led-010', entry_type: 'DEPOSIT',    amount:  '8000.00', currency: 'USD', balance_after:  '8000.00', narration: 'Wire WT-2025-0407',      created_at: '2025-04-10T11:05:00Z', mt5_login: 1000102, client_name: 'James Harrington' },
  ],
};

export const mockReconciliation = {
  records: [
    { id: 'recon-001', recon_date: '2025-04-14', status: 'MATCHED',   notes: 'All A-Book trades matched to LP statement', resolved_by_name: 'Sarah Finance', created_at: '2025-04-15T08:00:00Z' },
    { id: 'recon-002', recon_date: '2025-04-15', status: 'MATCHED',   notes: 'Daily recon complete — no discrepancies',   resolved_by_name: 'Sarah Finance', created_at: '2025-04-16T08:00:00Z' },
    { id: 'recon-003', recon_date: '2025-04-16', status: 'DISCREPANCY', notes: 'LP swap figure mismatch — $12 difference', resolved_by_name: null,            created_at: '2025-04-17T08:00:00Z' },
    { id: 'recon-004', recon_date: '2025-04-17', status: 'PENDING',   notes: null,                                        resolved_by_name: null,            created_at: '2025-04-18T08:00:00Z' },
    { id: 'recon-005', recon_date: '2025-04-18', status: 'PENDING',   notes: null,                                        resolved_by_name: null,            created_at: '2025-04-19T08:00:00Z' },
  ],
};

export const mockEODStatus = {
  id: 'eod-001',
  eod_date: '2025-04-18',
  status: 'COMPLETED',
  records_processed: 147,
  error_message: null,
  locked_by_name: 'admin@demo.com',
  created_at: '2025-04-18T00:05:00Z',
  completed_at: '2025-04-18T00:07:34Z',
};

export const mockIBCommissions = {
  commissions: [
    { id: 'ib-001', ib_client_id: 'client-ib-01', ib_name: 'Global FX Partners Ltd', ib_code: 'IB001', ib_level: 'L1', trade_id: 'trade-004', amount:  '450.00', currency: 'USD', status: 'PAID',    created_at: '2025-04-03T10:10:00Z' },
    { id: 'ib-002', ib_client_id: 'client-ib-01', ib_name: 'Global FX Partners Ltd', ib_code: 'IB001', ib_level: 'L1', trade_id: 'trade-005', amount:  '348.00', currency: 'USD', status: 'PAID',    created_at: '2025-04-04T09:20:00Z' },
    { id: 'ib-003', ib_client_id: 'client-ib-02', ib_name: 'MENA Capital Brokers',   ib_code: 'IB002', ib_level: 'L2', trade_id: 'trade-007', amount:  '440.00', currency: 'USD', status: 'PAID',    created_at: '2025-04-05T11:35:00Z' },
    { id: 'ib-004', ib_client_id: 'client-ib-01', ib_name: 'Global FX Partners Ltd', ib_code: 'IB001', ib_level: 'L1', trade_id: 'trade-013', amount:  '300.00', currency: 'USD', status: 'PENDING', created_at: '2025-04-11T09:35:00Z' },
    { id: 'ib-005', ib_client_id: 'client-ib-01', ib_name: 'Global FX Partners Ltd', ib_code: 'IB001', ib_level: 'L1', trade_id: 'trade-014', amount: '1000.00', currency: 'USD', status: 'PENDING', created_at: '2025-04-12T14:10:00Z' },
    { id: 'ib-006', ib_client_id: 'client-ib-02', ib_name: 'MENA Capital Brokers',   ib_code: 'IB002', ib_level: 'L2', trade_id: 'trade-016', amount:  '400.00', currency: 'USD', status: 'PENDING', created_at: '2025-04-14T15:05:00Z' },
    { id: 'ib-007', ib_client_id: 'client-ib-03', ib_name: 'Asia Pacific Trading',   ib_code: 'IB003', ib_level: 'L3', trade_id: 'trade-018', amount:   '85.00', currency: 'USD', status: 'PENDING', created_at: '2025-04-15T10:00:00Z' },
    { id: 'ib-008', ib_client_id: 'client-ib-03', ib_name: 'Asia Pacific Trading',   ib_code: 'IB003', ib_level: 'L3', trade_id: 'trade-019', amount:   '60.00', currency: 'USD', status: 'PAID',    created_at: '2025-04-10T14:00:00Z' },
  ],
  summary: [
    { ib_client_id: 'client-ib-01', ib_name: 'Global FX Partners Ltd', ib_code: 'IB001', ib_level: 'L1', parent_ib_id: null,           parent_ib_name: null,                  sub_ib_count: 1, total_pending: '1300.00', total_paid:  '798.00' },
    { ib_client_id: 'client-ib-02', ib_name: 'MENA Capital Brokers',   ib_code: 'IB002', ib_level: 'L2', parent_ib_id: 'client-ib-01', parent_ib_name: 'Global FX Partners Ltd', sub_ib_count: 1, total_pending:  '400.00', total_paid:  '440.00' },
    { ib_client_id: 'client-ib-03', ib_name: 'Asia Pacific Trading',   ib_code: 'IB003', ib_level: 'L3', parent_ib_id: 'client-ib-02', parent_ib_name: 'MENA Capital Brokers',  sub_ib_count: 0, total_pending:   '85.00', total_paid:   '60.00' },
  ],
};

export const mockUsers = {
  users: [
    { id: 'user-001', email: 'admin@demo.com',    full_name: 'Admin User',          role_id: 'role-cfo',  role_name: 'CFO',                is_active: true,  last_login: '2025-04-18T08:00:00Z', created_at: '2024-01-01T00:00:00Z' },
    { id: 'user-002', email: 'sarah@demo.com',    full_name: 'Sarah Finance',       role_id: 'role-sr',   role_name: 'Senior_Accountant',  is_active: true,  last_login: '2025-04-18T07:45:00Z', created_at: '2024-01-15T00:00:00Z' },
    { id: 'user-003', email: 'john@demo.com',     full_name: 'John Assistant',      role_id: 'role-asst', role_name: 'Accounts_Assistant', is_active: true,  last_login: '2025-04-17T16:30:00Z', created_at: '2024-02-01T00:00:00Z' },
    { id: 'user-004', email: 'ib@demo.com',       full_name: 'IB Manager',          role_id: 'role-ib',   role_name: 'IB_Manager',         is_active: true,  last_login: '2025-04-16T10:00:00Z', created_at: '2024-02-15T00:00:00Z' },
    { id: 'user-005', email: 'risk@demo.com',     full_name: 'Risk Officer',        role_id: 'role-risk', role_name: 'Risk_Manager',       is_active: true,  last_login: '2025-04-18T09:15:00Z', created_at: '2024-03-01T00:00:00Z' },
    { id: 'user-006', email: 'readonly@demo.com', full_name: 'Read Only Analyst',   role_id: 'role-ro',   role_name: 'Read_Only',          is_active: false, last_login: '2025-03-30T14:00:00Z', created_at: '2024-03-15T00:00:00Z' },
  ],
};

export const mockRoles = {
  roles: [
    { id: 'role-cfo',  name: 'CFO' },
    { id: 'role-sr',   name: 'Senior_Accountant' },
    { id: 'role-asst', name: 'Accounts_Assistant' },
    { id: 'role-ib',   name: 'IB_Manager' },
    { id: 'role-risk', name: 'Risk_Manager' },
    { id: 'role-ro',   name: 'Read_Only' },
  ],
};

export const mockCOA = {
  accounts: [
    { id: 'coa-1100', code: '1100', name: 'Operational Cash',           type: 'ASSET',     subtype: 'CASH',         normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-1110', code: '1110', name: 'Operating Bank Account',     type: 'ASSET',     subtype: 'CASH',         normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-1200', code: '1200', name: 'Segregated Client Funds',    type: 'ASSET',     subtype: 'CLIENT_FUNDS', normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-1210', code: '1210', name: 'Client Deposits Clearing',   type: 'ASSET',     subtype: 'CLIENT_FUNDS', normal_balance: 'DEBIT',  is_system: true,  is_active: true, parent_code: '1200' },
    { id: 'coa-1300', code: '1300', name: 'LP Account (MT5 Margin)',    type: 'ASSET',     subtype: 'LP',           normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-1410', code: '1410', name: 'IB Commission Receivable',   type: 'ASSET',     subtype: 'RECEIVABLE',   normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-2100', code: '2100', name: 'Client Payable (Equity)',    type: 'LIABILITY', subtype: 'CLIENT_EQUITY',normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-2110', code: '2110', name: 'Client Deposits Payable',    type: 'LIABILITY', subtype: 'CLIENT_EQUITY',normal_balance: 'CREDIT', is_system: true,  is_active: true, parent_code: '2100' },
    { id: 'coa-2200', code: '2200', name: 'IB Commissions Payable',     type: 'LIABILITY', subtype: 'IB',           normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-2300', code: '2300', name: 'Swap Payable',               type: 'LIABILITY', subtype: 'SWAP',         normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-3100', code: '3100', name: 'Retained Earnings',          type: 'EQUITY',    subtype: 'RETAINED',     normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-3200', code: '3200', name: 'Current Year Earnings',      type: 'EQUITY',    subtype: 'CURRENT',      normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4110', code: '4110', name: 'Spread Income - Forex',      type: 'REVENUE',   subtype: 'SPREAD',       normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4120', code: '4120', name: 'Spread Income - Metals',     type: 'REVENUE',   subtype: 'SPREAD',       normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4200', code: '4200', name: 'Spread Income B-Book',       type: 'REVENUE',   subtype: 'SPREAD',       normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4300', code: '4300', name: 'B-Book P&L Income',          type: 'REVENUE',   subtype: 'BBOOK',        normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4400', code: '4400', name: 'Commission Income',          type: 'REVENUE',   subtype: 'COMMISSION',   normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-4500', code: '4500', name: 'Swap Income',                type: 'REVENUE',   subtype: 'SWAP',         normal_balance: 'CREDIT', is_system: true,  is_active: true },
    { id: 'coa-5100', code: '5100', name: 'LP Hedging Cost',            type: 'EXPENSE',   subtype: 'LP_COST',      normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-5200', code: '5200', name: 'B-Book P&L Loss',            type: 'EXPENSE',   subtype: 'BBOOK',        normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-5300', code: '5300', name: 'Swap Expense',               type: 'EXPENSE',   subtype: 'SWAP',         normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-5400', code: '5400', name: 'IB Commission Expense',      type: 'EXPENSE',   subtype: 'IB',           normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-5600', code: '5600', name: 'Gateway Fees',               type: 'EXPENSE',   subtype: 'GATEWAY',      normal_balance: 'DEBIT',  is_system: true,  is_active: true },
    { id: 'coa-5800', code: '5800', name: 'Operating Expenses',         type: 'EXPENSE',   subtype: 'OPEX',         normal_balance: 'DEBIT',  is_system: true,  is_active: true },
  ],
};
