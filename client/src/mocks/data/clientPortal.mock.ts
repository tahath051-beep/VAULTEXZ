import type { ClientUser } from '@/stores/clientAuth.store';

export const MOCK_CLIENT_TOKEN = 'mock-client-portal-token-marcus-okafor';

export const MOCK_CLIENT_USER: ClientUser = {
  id: 'client-003',
  email: 'client@demo.com',
  full_name: 'Marcus Okafor',
  client_code: 'CLT003',
  phone: '+234 801 234 5678',
  country: 'Nigeria',
  kyc_status: 'APPROVED',
  linked_ib: 'IB001 - TradePro Partners',
  created_at: '2024-03-20T08:15:00Z',
};

export const mockClientAccounts = [
  {
    id: 'mt5-004',
    mt5_login: 1000301,
    account_type: 'Standard',
    currency: 'USD',
    leverage: 100,
    balance: 9000.00,
    equity: 9250.00,
    margin: 250.00,
    free_margin: 9000.00,
  },
  {
    id: 'mt5-007',
    mt5_login: 1000302,
    account_type: 'Premium',
    currency: 'USD',
    leverage: 200,
    balance: 3500.00,
    equity: 3500.00,
    margin: 0,
    free_margin: 3500.00,
  },
];

export const mockClientTrades = [
  { id: 'trade-006',  ticket: 5000006,  mt5_login: 1000301, symbol: 'GBPUSD', direction: 'BUY',  volume: 1.00, open_price: 1.25600, close_price: 1.26200, profit:   600.00, swap:  -5.00, commission:  -10.00, close_time: '2025-04-04T15:45:00Z' },
  { id: 'trade-012',  ticket: 5000012,  mt5_login: 1000301, symbol: 'EURUSD', direction: 'BUY',  volume: 1.50, open_price: 1.08600, close_price: 1.09100, profit:   750.00, swap:  -9.00, commission:  -15.00, close_time: '2025-04-10T12:00:00Z' },
  { id: 'trade-017',  ticket: 5000017,  mt5_login: 1000301, symbol: 'USDJPY', direction: 'BUY',  volume: 2.00, open_price: 148.900, close_price: 149.600, profit:   933.00, swap: -14.00, commission:  -20.00, close_time: '2025-04-15T08:30:00Z' },
  { id: 'ctrade-001', ticket: 5000101,  mt5_login: 1000302, symbol: 'XAUUSD', direction: 'SELL', volume: 0.50, open_price: 2340.00, close_price: 2318.00, profit:  1100.00, swap: -20.00, commission:  -12.50, close_time: '2025-04-05T11:30:00Z' },
  { id: 'ctrade-002', ticket: 5000102,  mt5_login: 1000302, symbol: 'EURUSD', direction: 'SELL', volume: 1.00, open_price: 1.09200, close_price: 1.08750, profit:   450.00, swap:  -6.00, commission:  -10.00, close_time: '2025-04-08T16:20:00Z' },
  { id: 'ctrade-003', ticket: 5000103,  mt5_login: 1000301, symbol: 'GBPUSD', direction: 'SELL', volume: 0.50, open_price: 1.27200, close_price: 1.27800, profit:  -300.00, swap:  -4.00, commission:   -5.00, close_time: '2025-04-12T14:00:00Z' },
  { id: 'ctrade-004', ticket: 5000104,  mt5_login: 1000302, symbol: 'USDJPY', direction: 'SELL', volume: 1.00, open_price: 151.500, close_price: 150.900, profit:   398.00, swap:  -5.00, commission:  -10.00, close_time: '2025-04-13T11:15:00Z' },
  { id: 'ctrade-005', ticket: 5000105,  mt5_login: 1000301, symbol: 'XAUUSD', direction: 'BUY',  volume: 0.30, open_price: 2280.00, close_price: 2305.00, profit:   750.00, swap: -12.00, commission:   -7.50, close_time: '2025-04-16T13:45:00Z' },
  { id: 'ctrade-006', ticket: 5000106,  mt5_login: 1000302, symbol: 'EURUSD', direction: 'BUY',  volume: 2.00, open_price: 1.07900, close_price: 1.08400, profit:  1000.00, swap: -14.00, commission:  -20.00, close_time: '2025-04-17T10:00:00Z' },
  { id: 'ctrade-007', ticket: 5000107,  mt5_login: 1000301, symbol: 'AUDUSD', direction: 'BUY',  volume: 1.00, open_price: 0.65200, close_price: 0.65800, profit:   600.00, swap:  -3.00, commission:  -10.00, close_time: '2025-04-18T16:00:00Z' },
  { id: 'ctrade-008', ticket: 5000108,  mt5_login: 1000302, symbol: 'GBPUSD', direction: 'SELL', volume: 0.50, open_price: 1.26800, close_price: 1.26200, profit:   300.00, swap:  -4.00, commission:   -5.00, close_time: '2025-04-19T09:30:00Z' },
  { id: 'ctrade-009', ticket: 5000109,  mt5_login: 1000301, symbol: 'EURUSD', direction: 'SELL', volume: 1.00, open_price: 1.09500, close_price: 1.09000, profit:   500.00, swap:  -7.00, commission:  -10.00, close_time: '2025-04-20T14:30:00Z' },
  { id: 'ctrade-010', ticket: 5000110,  mt5_login: 1000302, symbol: 'XAUUSD', direction: 'BUY',  volume: 0.20, open_price: 2295.00, close_price: 2280.00, profit:  -300.00, swap:  -8.00, commission:   -5.00, close_time: '2025-04-21T11:00:00Z' },
  { id: 'ctrade-011', ticket: 5000111,  mt5_login: 1000301, symbol: 'USDJPY', direction: 'SELL', volume: 1.50, open_price: 149.800, close_price: 148.900, profit:   898.00, swap: -10.00, commission:  -15.00, close_time: '2025-04-22T08:00:00Z' },
  { id: 'ctrade-012', ticket: 5000112,  mt5_login: 1000302, symbol: 'GBPUSD', direction: 'BUY',  volume: 1.00, open_price: 1.25000, close_price: 1.25800, profit:   800.00, swap:  -6.00, commission:  -10.00, close_time: '2025-04-23T15:00:00Z' },
];

export const mockClientTransactions = [
  { id: 'ctxn-init',  type: 'DEPOSIT',    amount: 5000.00, currency: 'USD', amount_usd: 5000.00, status: 'APPROVED', gateway: 'Bank Wire',    reference: 'WT-2024-0320', mt5_login: 1000301, date: '2024-03-20T09:00:00Z', narration: 'Initial deposit'            },
  { id: 'ctxn-002',   type: 'DEPOSIT',    amount: 2000.00, currency: 'USD', amount_usd: 2000.00, status: 'APPROVED', gateway: 'Crypto (USDT)',reference: 'CR-2025-0115', mt5_login: 1000301, date: '2025-01-15T11:00:00Z', narration: 'Top-up'                     },
  { id: 'ctxn-003',   type: 'DEPOSIT',    amount: 3500.00, currency: 'USD', amount_usd: 3500.00, status: 'APPROVED', gateway: 'Bank Wire',    reference: 'WT-2025-0201', mt5_login: 1000302, date: '2025-02-01T10:00:00Z', narration: 'Premium account funding'    },
  { id: 'ctxn-004',   type: 'WITHDRAWAL', amount:  500.00, currency: 'USD', amount_usd:  500.00, status: 'APPROVED', gateway: 'Bank Wire',    reference: 'WD-2025-0310', mt5_login: 1000301, date: '2025-03-10T14:00:00Z', narration: 'Profit withdrawal'          },
  { id: 'ctxn-005',   type: 'DEPOSIT',    amount: 2000.00, currency: 'USD', amount_usd: 2000.00, status: 'REJECTED', gateway: 'Manual',       reference: 'MN-2025-0401', mt5_login: 1000301, date: '2025-04-01T09:00:00Z', narration: 'Failed verification'        },
  { id: 'pay-004',    type: 'DEPOSIT',    amount: 3000.00, currency: 'USD', amount_usd: 3000.00, status: 'APPROVED', gateway: 'Crypto (USDT)',reference: 'CR-2025-0404', mt5_login: 1000301, date: '2025-04-04T10:15:00Z', narration: 'Crypto top-up USDT'         },
  { id: 'pay-008',    type: 'WITHDRAWAL', amount: 1500.00, currency: 'USD', amount_usd: 1500.00, status: 'PENDING',  gateway: 'Bank Wire',    reference: 'WD-2025-0408', mt5_login: 1000301, date: '2025-04-16T08:30:00Z', narration: 'Partial withdrawal'         },
];
