import type { IBUser } from '@/stores/ibAuth.store';

export const MOCK_IB_TOKEN = 'mock-ib-portal-token-ahmed-al-rashidi';

export const MOCK_IB_USER: IBUser = {
  id: 'ib-001',
  email: 'ib@demo.com',
  full_name: 'Ahmed Al-Rashidi',
  ib_code: 'IB001',
  level: 1,
  level_label: 'L1',
  status: 'ACTIVE',
  commission_plan: 'Standard Volume Plan',
  commission_rate: '$10 per lot traded by referred clients',
  joined_at: '2023-06-15T09:00:00Z',
  payment_method: 'Bank Wire',
  bank_details: 'HSBC Dubai — AE12 0330 0000 1234 5678 901',
  referral_link: 'https://fxaccounting.demo/register?ref=IB001',
  referral_clicks: 234,
};

export const mockIBSubIBs = [
  { id: 'ib-002', ib_code: 'IB002', full_name: 'Sarah Johnson',  level: 2, level_label: 'L2', clients: 3, total_volume: 45.50, total_commission: 680.50, status: 'ACTIVE' },
  { id: 'ib-003', ib_code: 'IB003', full_name: 'Wei Chen',       level: 2, level_label: 'L2', clients: 2, total_volume: 28.00, total_commission: 420.00, status: 'ACTIVE' },
];

export const mockIBClients = [
  { id: 'ic-c1', client_code: 'CLT008', full_name: 'David Müller',       registered_at: '2023-08-10T09:00:00Z', total_volume: 85.50, total_trades: 42, commission_generated: 850.00, is_active: true  },
  { id: 'ic-c2', client_code: 'CLT009', full_name: 'Priya Sharma',       registered_at: '2023-09-05T11:00:00Z', total_volume: 62.00, total_trades: 31, commission_generated: 620.00, is_active: true  },
  { id: 'ic-c3', client_code: 'CLT010', full_name: 'Carlos Mendez',      registered_at: '2023-10-20T14:00:00Z', total_volume: 45.00, total_trades: 22, commission_generated: 450.00, is_active: true  },
  { id: 'ic-c4', client_code: 'CLT011', full_name: 'Yuki Tanaka',        registered_at: '2023-11-15T10:00:00Z', total_volume: 38.50, total_trades: 19, commission_generated: 385.00, is_active: true  },
  { id: 'ic-c5', client_code: 'CLT012', full_name: 'Emma Wilson',        registered_at: '2024-01-08T09:00:00Z', total_volume: 55.00, total_trades: 28, commission_generated: 550.00, is_active: true  },
  { id: 'ic-c6', client_code: 'CLT013', full_name: 'Oluwaseun Adeyemi',  registered_at: '2024-02-20T13:00:00Z', total_volume: 20.00, total_trades: 10, commission_generated: 200.00, is_active: false },
  { id: 'ic-c7', client_code: 'CLT014', full_name: 'François Dupont',    registered_at: '2024-03-15T11:00:00Z', total_volume: 30.00, total_trades: 15, commission_generated: 300.00, is_active: true  },
  { id: 'ic-c8', client_code: 'CLT015', full_name: 'Ana Cristina Pérez', registered_at: '2024-04-01T09:00:00Z', total_volume:  8.00, total_trades:  5, commission_generated:  80.00, is_active: true  },
];

// Commissions: PAID=$2250, LOCKED=$800, PENDING=$1200  total=$4250
export const mockIBCommissionEntries = [
  // PAID (sum=2250)
  { id: 'ic-001', date: '2025-01-15T10:00:00Z', client: 'David Müller',      client_code: 'CLT008', symbol: 'EURUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'PAID',    ticket: 5000201 },
  { id: 'ic-002', date: '2025-01-20T14:00:00Z', client: 'Priya Sharma',      client_code: 'CLT009', symbol: 'GBPUSD', volume: 1.50, commission_type: 'Volume',  amount: 185.00, status: 'PAID',    ticket: 5000202 },
  { id: 'ic-003', date: '2025-02-05T09:00:00Z', client: 'Carlos Mendez',     client_code: 'CLT010', symbol: 'XAUUSD', volume: 1.00, commission_type: 'Volume',  amount: 220.00, status: 'PAID',    ticket: 5000203 },
  { id: 'ic-004', date: '2025-02-14T11:00:00Z', client: 'David Müller',      client_code: 'CLT008', symbol: 'EURUSD', volume: 2.00, commission_type: 'Volume',  amount: 195.00, status: 'PAID',    ticket: 5000204 },
  { id: 'ic-005', date: '2025-02-28T15:00:00Z', client: 'Emma Wilson',       client_code: 'CLT012', symbol: 'USDJPY', volume: 1.50, commission_type: 'Volume',  amount: 175.00, status: 'PAID',    ticket: 5000205 },
  { id: 'ic-006', date: '2025-03-08T10:00:00Z', client: 'Yuki Tanaka',       client_code: 'CLT011', symbol: 'GBPUSD', volume: 1.00, commission_type: 'Volume',  amount: 185.00, status: 'PAID',    ticket: 5000206 },
  { id: 'ic-007', date: '2025-03-15T13:00:00Z', client: 'Priya Sharma',      client_code: 'CLT009', symbol: 'EURUSD', volume: 2.00, commission_type: 'Volume',  amount: 210.00, status: 'PAID',    ticket: 5000207 },
  { id: 'ic-008', date: '2025-03-22T09:00:00Z', client: 'François Dupont',   client_code: 'CLT014', symbol: 'XAUUSD', volume: 1.00, commission_type: 'Volume',  amount: 160.00, status: 'PAID',    ticket: 5000208 },
  { id: 'ic-009', date: '2025-04-01T11:00:00Z', client: 'Carlos Mendez',     client_code: 'CLT010', symbol: 'GBPUSD', volume: 1.50, commission_type: 'Volume',  amount: 195.00, status: 'PAID',    ticket: 5000209 },
  { id: 'ic-010', date: '2025-04-08T14:00:00Z', client: 'David Müller',      client_code: 'CLT008', symbol: 'EURUSD', volume: 2.50, commission_type: 'Volume',  amount: 225.00, status: 'PAID',    ticket: 5000210 },
  { id: 'ic-011', date: '2025-04-12T10:00:00Z', client: 'Emma Wilson',       client_code: 'CLT012', symbol: 'USDJPY', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'PAID',    ticket: 5000211 },
  { id: 'ic-012', date: '2025-04-14T09:00:00Z', client: 'Ana Cristina Pérez',client_code: 'CLT015', symbol: 'EURUSD', volume: 1.00, commission_type: 'Volume',  amount: 100.00, status: 'PAID',    ticket: 5000212 },
  // LOCKED (sum=800)
  { id: 'ic-013', date: '2025-04-18T11:00:00Z', client: 'David Müller',      client_code: 'CLT008', symbol: 'EURUSD', volume: 2.50, commission_type: 'Volume',  amount: 250.00, status: 'LOCKED',  ticket: 5000213 },
  { id: 'ic-014', date: '2025-04-19T14:00:00Z', client: 'Priya Sharma',      client_code: 'CLT009', symbol: 'GBPUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'LOCKED',  ticket: 5000214 },
  { id: 'ic-015', date: '2025-04-21T09:00:00Z', client: 'Carlos Mendez',     client_code: 'CLT010', symbol: 'XAUUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'LOCKED',  ticket: 5000215 },
  { id: 'ic-016', date: '2025-04-22T10:00:00Z', client: 'Emma Wilson',       client_code: 'CLT012', symbol: 'EURUSD', volume: 1.50, commission_type: 'Volume',  amount: 150.00, status: 'LOCKED',  ticket: 5000216 },
  // PENDING (sum=1200)
  { id: 'ic-017', date: '2025-04-23T10:00:00Z', client: 'Yuki Tanaka',       client_code: 'CLT011', symbol: 'EURUSD', volume: 2.50, commission_type: 'Volume',  amount: 250.00, status: 'PENDING', ticket: 5000217 },
  { id: 'ic-018', date: '2025-04-23T11:00:00Z', client: 'David Müller',      client_code: 'CLT008', symbol: 'GBPUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'PENDING', ticket: 5000218 },
  { id: 'ic-019', date: '2025-04-24T09:00:00Z', client: 'Priya Sharma',      client_code: 'CLT009', symbol: 'XAUUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'PENDING', ticket: 5000219 },
  { id: 'ic-020', date: '2025-04-24T10:00:00Z', client: 'François Dupont',   client_code: 'CLT014', symbol: 'USDJPY', volume: 1.50, commission_type: 'Volume',  amount: 175.00, status: 'PENDING', ticket: 5000220 },
  { id: 'ic-021', date: '2025-04-24T14:00:00Z', client: 'Carlos Mendez',     client_code: 'CLT010', symbol: 'GBPUSD', volume: 1.50, commission_type: 'Volume',  amount: 175.00, status: 'PENDING', ticket: 5000221 },
  { id: 'ic-022', date: '2025-04-25T09:00:00Z', client: 'Emma Wilson',       client_code: 'CLT012', symbol: 'EURUSD', volume: 2.00, commission_type: 'Volume',  amount: 200.00, status: 'PENDING', ticket: 5000222 },
];

// 7-day daily commission chart data
export const mockIBDailyStats = [
  { day: 'Mon', date: '2025-04-21', amount: 200 },
  { day: 'Tue', date: '2025-04-22', amount: 150 },
  { day: 'Wed', date: '2025-04-23', amount: 450 },
  { day: 'Thu', date: '2025-04-24', amount: 550 },
  { day: 'Fri', date: '2025-04-25', amount: 200 },
  { day: 'Sat', date: '2025-04-26', amount:   0 },
  { day: 'Sun', date: '2025-04-27', amount:   0 },
];

export const mockIBNotifications = [
  { id: 'ibn-1', title: 'New client registered', description: 'Ana Cristina Pérez signed up via your referral link.', is_read: false, created_at: '2025-04-24T09:30:00Z' },
  { id: 'ibn-2', title: 'Commission locked',      description: '$800 commission has been locked and is ready for payout.', is_read: false, created_at: '2025-04-22T10:00:00Z' },
  { id: 'ibn-3', title: 'Payout processed',       description: 'Your payout of $2,250 was sent via Bank Wire.', is_read: true,  created_at: '2025-04-15T14:00:00Z' },
];
