export const mockClients = [
  {
    id: 'client-001', client_code: 'CLT001', full_name: 'James Harrington',
    email: 'james.harrington@email.com', phone: '+44 7700 900123',
    country: 'United Kingdom', is_active: true,
    created_at: '2024-01-15T09:00:00Z', mt5_account_count: 2,
  },
  {
    id: 'client-002', client_code: 'CLT002', full_name: 'Sophia Chen',
    email: 'sophia.chen@tradepro.hk', phone: '+852 9876 5432',
    country: 'Hong Kong', is_active: true,
    created_at: '2024-02-03T11:30:00Z', mt5_account_count: 1,
  },
  {
    id: 'client-003', client_code: 'CLT003', full_name: 'Marcus Okafor',
    email: 'm.okafor@invest.ng', phone: '+234 801 234 5678',
    country: 'Nigeria', is_active: true,
    created_at: '2024-03-20T08:15:00Z', mt5_account_count: 1,
  },
  {
    id: 'client-004', client_code: 'CLT004', full_name: 'Elena Vasquez',
    email: 'elena.vasquez@fx-trading.es', phone: '+34 612 345 678',
    country: 'Spain', is_active: true,
    created_at: '2024-04-07T14:45:00Z', mt5_account_count: 2,
  },
  {
    id: 'client-005', client_code: 'CLT005', full_name: 'Ahmed Al-Rashid',
    email: 'ahmed.rashid@gulf-fx.ae', phone: '+971 50 123 4567',
    country: 'UAE', is_active: false,
    created_at: '2024-05-12T10:00:00Z', mt5_account_count: 1,
  },
];

export const mockClientDetails: Record<string, object> = {
  'client-001': {
    ...mockClients[0],
    mt5_accounts: [
      { id: 'mt5-001', mt5_login: 1000101, currency: 'USD', book_type: 'A', current_balance: '25840.50' },
      { id: 'mt5-002', mt5_login: 1000102, currency: 'USD', book_type: 'B', current_balance: '8200.00' },
    ],
  },
  'client-002': {
    ...mockClients[1],
    mt5_accounts: [
      { id: 'mt5-003', mt5_login: 1000201, currency: 'USD', book_type: 'A', current_balance: '52300.00' },
    ],
  },
  'client-003': {
    ...mockClients[2],
    mt5_accounts: [
      { id: 'mt5-004', mt5_login: 1000301, currency: 'USD', book_type: 'B', current_balance: '3100.75' },
    ],
  },
  'client-004': {
    ...mockClients[3],
    mt5_accounts: [
      { id: 'mt5-005', mt5_login: 1000401, currency: 'USD', book_type: 'A', current_balance: '18450.25' },
      { id: 'mt5-006', mt5_login: 1000402, currency: 'EUR', book_type: 'B', current_balance: '9780.00' },
    ],
  },
  'client-005': {
    ...mockClients[4],
    mt5_accounts: [
      { id: 'mt5-007', mt5_login: 1000501, currency: 'USD', book_type: 'A', current_balance: '0.00' },
    ],
  },
};
