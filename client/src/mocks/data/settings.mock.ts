export const mockSymbols = [
  { id: 'sym-001', symbol: 'EURUSD', pip_value_usd: '10.00', broker_spread: '1.5', lp_spread: '0.5', markup: '1.0', contract_size: '100000', asset_class: 'FOREX',  is_active: true, effective_from: '2024-01-01' },
  { id: 'sym-002', symbol: 'GBPUSD', pip_value_usd: '10.00', broker_spread: '1.8', lp_spread: '0.7', markup: '1.1', contract_size: '100000', asset_class: 'FOREX',  is_active: true, effective_from: '2024-01-01' },
  { id: 'sym-003', symbol: 'XAUUSD', pip_value_usd: '1.00',  broker_spread: '4.0', lp_spread: '2.0', markup: '2.0', contract_size: '100',    asset_class: 'METALS', is_active: true, effective_from: '2024-01-01' },
  { id: 'sym-004', symbol: 'USDJPY', pip_value_usd: '9.15',  broker_spread: '1.3', lp_spread: '0.4', markup: '0.9', contract_size: '100000', asset_class: 'FOREX',  is_active: true, effective_from: '2024-01-01' },
  { id: 'sym-005', symbol: 'USDCHF', pip_value_usd: '10.00', broker_spread: '1.6', lp_spread: '0.6', markup: '1.0', contract_size: '100000', asset_class: 'FOREX',  is_active: true, effective_from: '2024-01-01' },
  { id: 'sym-006', symbol: 'AUDUSD', pip_value_usd: '10.00', broker_spread: '1.7', lp_spread: '0.6', markup: '1.1', contract_size: '100000', asset_class: 'FOREX',  is_active: false, effective_from: '2024-01-01' },
];

export const mockGeneralSettings = {
  broker_name: 'FX Pro Brokerage Ltd',
  timezone: 'UTC',
  mt5_server: 'fx.mt5server.com:443',
  withdrawal_approval_steps: 1,
  reconciliation_threshold: '0.01',
  eod_schedule_time: '23:00',
  report_delivery_emails: ['admin@fxpro.com', 'finance@fxpro.com'],
};

export const mockGateways = [
  { id: 'gw-001', name: 'Manual', type: 'MANUAL',    is_active: true,  min_deposit: '100',  max_deposit: '1000000', min_withdrawal: '50',  max_withdrawal: '500000'  },
  { id: 'gw-002', name: 'Bank Wire', type: 'BANK_WIRE', is_active: true,  min_deposit: '500',  max_deposit: '5000000', min_withdrawal: '200', max_withdrawal: '2000000' },
  { id: 'gw-003', name: 'Crypto',   type: 'CRYPTO',   is_active: false, min_deposit: '50',   max_deposit: '100000',  min_withdrawal: '50',  max_withdrawal: '100000'  },
  { id: 'gw-004', name: 'Other',    type: 'OTHER',    is_active: false, min_deposit: '100',  max_deposit: '500000',  min_withdrawal: '100', max_withdrawal: '200000'  },
];

export const mockNotifications = [
  { id: 'n-001', type: 'RECON_BREAK',          title: 'Reconciliation Break Detected',  description: 'MT5 vs ledger discrepancy of $1,250.00 for account CLT002',      is_read: false, created_at: '2026-04-25T08:30:00Z' },
  { id: 'n-002', type: 'LARGE_WITHDRAWAL',      title: 'Large Withdrawal Request',       description: 'James Harrington requested a withdrawal of $85,000',              is_read: false, created_at: '2026-04-25T07:15:00Z' },
  { id: 'n-003', type: 'NEGATIVE_BALANCE',      title: 'Negative Balance Alert',         description: 'MT5 account #1000102 balance fell below $0 — action required',   is_read: false, created_at: '2026-04-24T22:00:00Z' },
  { id: 'n-004', type: 'IB_PAYOUT_DUE',         title: 'IB Payout Due',                  description: 'Global FX Partners Ltd has $1,300.00 in pending commissions',    is_read: true,  created_at: '2026-04-24T16:45:00Z' },
  { id: 'n-005', type: 'LP_STATEMENT_MISSING',  title: 'LP Statement Missing',           description: 'No LP settlement statement received for 2026-04-24',             is_read: true,  created_at: '2026-04-24T09:00:00Z' },
];
