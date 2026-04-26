const makeLines = (entries: { account_id: string; account_code: string; account_name: string; debit: string; credit: string }[]) => entries;

export const mockJournals = [
  {
    id: 'je-001', entry_date: '2025-04-01', reference_type: 'DEPOSIT', reference_id: 'pay-001',
    narration: 'Client deposit — James Harrington — WT-2025-0401', status: 'POSTED', created_at: '2025-04-01T09:05:00Z',
    lines: makeLines([
      { account_id: 'coa-1210', account_code: '1210', account_name: 'Client Deposits Clearing', debit: '10000.00', credit: '0.00' },
      { account_id: 'coa-2110', account_code: '2110', account_name: 'Client Deposits Payable',  debit: '0.00',     credit: '10000.00' },
    ]),
  },
  {
    id: 'je-002', entry_date: '2025-04-01', reference_type: 'TRADE_CLOSE', reference_id: 'trade-001',
    narration: 'Trade close EURUSD BUY 2.0 lots — A-Book — CLT001', status: 'POSTED', created_at: '2025-04-01T17:05:00Z',
    lines: makeLines([
      { account_id: 'coa-1300', account_code: '1300', account_name: 'LP Account (MT5 Margin)',  debit: '940.00',  credit: '0.00' },
      { account_id: 'coa-4110', account_code: '4110', account_name: 'Spread Income - Forex',    debit: '0.00',    credit: '18.80' },
      { account_id: 'coa-5100', account_code: '5100', account_name: 'LP Hedging Cost',          debit: '9.40',    credit: '0.00' },
      { account_id: 'coa-2100', account_code: '2100', account_name: 'Client Payable (Equity)',  debit: '0.00',    credit: '911.60' },
    ]),
  },
  {
    id: 'je-003', entry_date: '2025-04-02', reference_type: 'TRADE_CLOSE', reference_id: 'trade-003',
    narration: 'Trade close XAUUSD BUY 0.5 lots — B-Book loss — CLT001', status: 'POSTED', created_at: '2025-04-02T16:05:00Z',
    lines: makeLines([
      { account_id: 'coa-4300', account_code: '4300', account_name: 'B-Book P&L Income',        debit: '0.00',    credit: '1250.00' },
      { account_id: 'coa-4200', account_code: '4200', account_name: 'Spread Income B-Book',     debit: '0.00',    credit: '12.50' },
      { account_id: 'coa-2100', account_code: '2100', account_name: 'Client Payable (Equity)',  debit: '1262.50', credit: '0.00' },
    ]),
  },
  {
    id: 'je-004', entry_date: '2025-04-03', reference_type: 'DEPOSIT', reference_id: 'pay-002',
    narration: 'Client deposit — Sophia Chen — SW-2025-0402', status: 'POSTED', created_at: '2025-04-03T11:35:00Z',
    lines: makeLines([
      { account_id: 'coa-1210', account_code: '1210', account_name: 'Client Deposits Clearing', debit: '25000.00', credit: '0.00' },
      { account_id: 'coa-2110', account_code: '2110', account_name: 'Client Deposits Payable',  debit: '0.00',     credit: '25000.00' },
    ]),
  },
  {
    id: 'je-005', entry_date: '2025-04-03', reference_type: 'TRADE_CLOSE', reference_id: 'trade-004',
    narration: 'Trade close EURUSD SELL 5.0 lots — A-Book — CLT002', status: 'POSTED', created_at: '2025-04-03T10:05:00Z',
    lines: makeLines([
      { account_id: 'coa-1300', account_code: '1300', account_name: 'LP Account (MT5 Margin)',  debit: '2250.00', credit: '0.00' },
      { account_id: 'coa-4110', account_code: '4110', account_name: 'Spread Income - Forex',    debit: '0.00',    credit: '47.00' },
      { account_id: 'coa-5100', account_code: '5100', account_name: 'LP Hedging Cost',          debit: '23.50',   credit: '0.00' },
      { account_id: 'coa-2100', account_code: '2100', account_name: 'Client Payable (Equity)',  debit: '0.00',    credit: '2179.50' },
    ]),
  },
  {
    id: 'je-006', entry_date: '2025-04-05', reference_type: 'WITHDRAWAL', reference_id: 'pay-003',
    narration: 'Client withdrawal — James Harrington — WD-2025-0403', status: 'POSTED', created_at: '2025-04-05T14:05:00Z',
    lines: makeLines([
      { account_id: 'coa-2110', account_code: '2110', account_name: 'Client Deposits Payable',  debit: '5000.00', credit: '0.00' },
      { account_id: 'coa-1110', account_code: '1110', account_name: 'Operating Bank Account',   debit: '0.00',    credit: '5000.00' },
    ]),
  },
  {
    id: 'je-007', entry_date: '2025-04-10', reference_type: 'MANUAL', reference_id: null,
    narration: 'Monthly IB commission accrual — April 2025', status: 'POSTED', created_at: '2025-04-10T09:00:00Z',
    lines: makeLines([
      { account_id: 'coa-5400', account_code: '5400', account_name: 'IB Commission Expense',    debit: '1840.00', credit: '0.00' },
      { account_id: 'coa-2200', account_code: '2200', account_name: 'IB Commissions Payable',   debit: '0.00',    credit: '1840.00' },
    ]),
  },
  {
    id: 'je-008', entry_date: '2025-04-12', reference_type: 'TRADE_CLOSE', reference_id: 'trade-014',
    narration: 'Trade close XAUUSD BUY 2.0 lots — A-Book — CLT002', status: 'POSTED', created_at: '2025-04-12T14:05:00Z',
    lines: makeLines([
      { account_id: 'coa-1300', account_code: '1300', account_name: 'LP Account (MT5 Margin)',  debit: '5000.00', credit: '0.00' },
      { account_id: 'coa-4120', account_code: '4120', account_name: 'Spread Income - Metals',   debit: '0.00',    credit: '100.00' },
      { account_id: 'coa-5100', account_code: '5100', account_name: 'LP Hedging Cost',          debit: '50.00',   credit: '0.00' },
      { account_id: 'coa-2100', account_code: '2100', account_name: 'Client Payable (Equity)',  debit: '0.00',    credit: '4850.00' },
    ]),
  },
];
