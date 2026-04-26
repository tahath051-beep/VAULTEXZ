import { http, HttpResponse, delay } from 'msw';
import { mockAuthData, MOCK_TOKEN, MOCK_USER } from '../data/auth.mock';
import { mockClients, mockClientDetails } from '../data/clients.mock';
import { mockTrades } from '../data/trades.mock';
import { mockPayments } from '../data/payments.mock';
import { mockJournals } from '../data/journals.mock';
import {
  mockPnL, mockBalanceSheet, mockLedger, mockReconciliation,
  mockEODStatus, mockIBCommissions, mockUsers, mockRoles, mockCOA,
} from '../data/reports.mock';
import { mockSymbols, mockGeneralSettings, mockGateways, mockNotifications } from '../data/settings.mock';
import {
  MOCK_CLIENT_TOKEN, MOCK_CLIENT_USER, mockClientAccounts, mockClientTrades, mockClientTransactions,
} from '../data/clientPortal.mock';
import {
  MOCK_IB_TOKEN, MOCK_IB_USER, mockIBSubIBs, mockIBClients,
  mockIBCommissionEntries, mockIBDailyStats, mockIBNotifications,
} from '../data/ib.mock';

// In-memory state for mutations
let clients      = [...mockClients];
let payments     = [...mockPayments];
let journals     = [...mockJournals];
let trades       = [...mockTrades];
let users        = [...mockUsers.users];
let coa          = [...mockCOA.accounts];
let ibComms      = [...mockIBCommissions.commissions];
let symbols      = [...mockSymbols];
let generalSettings = { ...mockGeneralSettings };
let gateways     = [...mockGateways];
let notifications = [...mockNotifications];

const ok = (data: unknown, status = 200) =>
  HttpResponse.json({ success: true, data }, { status });

const fail = (error: string, status = 400) =>
  HttpResponse.json({ success: false, error }, { status });

const paginate = <T>(arr: T[], limit: number, offset: number) =>
  arr.slice(offset, offset + limit);

export const handlers = [

  // ── AUTH (catch all possible base paths) ────────────────────────────────
  ...['/auth/login', '/api/auth/login', '/api/v1/auth/login'].map((path) =>
    http.post(path, async ({ request }) => {
      await delay(400);
      const body = await request.json() as { email?: string; password?: string };
      if (body.email === mockAuthData.validEmail && body.password === mockAuthData.validPassword) {
        return HttpResponse.json({
          success: true,
          data: { token: MOCK_TOKEN, user: MOCK_USER, permissions: ['*'] },
        });
      }
      return HttpResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    })
  ),

  ...['/auth/refresh', '/api/auth/refresh', '/api/v1/auth/refresh'].map((path) =>
    http.post(path, async () => {
      await delay(200);
      return HttpResponse.json({ success: true, data: { token: MOCK_TOKEN } });
    })
  ),

  ...['/auth/logout', '/api/auth/logout', '/api/v1/auth/logout'].map((path) =>
    http.post(path, async () => {
      await delay(100);
      return HttpResponse.json({ success: true, data: { message: 'Logged out' } });
    })
  ),

  // ── CLIENTS ──────────────────────────────────────────────────────────────
  http.get('/api/v1/clients', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit'))  || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const search = url.searchParams.get('search')?.toLowerCase();
    let filtered = clients;
    if (search) filtered = filtered.filter((c) =>
      c.full_name.toLowerCase().includes(search) ||
      c.client_code.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
    const isActive = url.searchParams.get('is_active');
    if (isActive != null) filtered = filtered.filter((c) => c.is_active === (isActive === 'true'));
    return ok({ clients: paginate(filtered, limit, offset), limit, offset });
  }),

  http.get('/api/v1/clients/:id', async ({ params }) => {
    await delay(200);
    const detail = mockClientDetails[params.id as string];
    if (!detail) return fail('Client not found', 404);
    return ok(detail);
  }),

  http.post('/api/v1/clients', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Record<string, string>;
    if (!body.client_code || !body.full_name || !body.email) return fail('client_code, full_name, email required');
    if (clients.find((c) => c.client_code === body.client_code)) return fail('Client code already exists', 409);
    const newClient = {
      id: `client-${Date.now()}`,
      client_code: body.client_code, full_name: body.full_name, email: body.email,
      phone: body.phone ?? '', country: body.country ?? '',
      is_active: true, created_at: new Date().toISOString(), mt5_account_count: 0,
    };
    clients = [newClient, ...clients];
    return ok(newClient, 201);
  }),

  http.patch('/api/v1/clients/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as Partial<typeof clients[0]>;
    const idx = clients.findIndex((c) => c.id === params.id);
    if (idx === -1) return fail('Client not found', 404);
    clients[idx] = { ...clients[idx], ...body };
    return ok(clients[idx]);
  }),

  // ── PAYMENTS ─────────────────────────────────────────────────────────────
  http.get('/api/v1/payments', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit'))  || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;
    let filtered = payments;
    const status = url.searchParams.get('status');
    const type   = url.searchParams.get('payment_type');
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (type)   filtered = filtered.filter((p) => p.payment_type === type);
    return ok({ payments: paginate(filtered, limit, offset), limit, offset });
  }),

  http.post('/api/v1/payments', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Partial<typeof payments[0]>;
    const newPayment = {
      id: `pay-${Date.now()}`,
      client_id: body.client_id ?? '',
      mt5_account_id: body.mt5_account_id ?? '',
      mt5_login: 0,
      payment_type: body.payment_type ?? 'DEPOSIT',
      amount: String(body.amount ?? '0'),
      currency: body.currency ?? 'USD',
      status: 'PENDING',
      narration: body.narration ?? '',
      reference_number: `REF-${Date.now()}`,
      journal_id: null as unknown as string,
      created_at: new Date().toISOString(),
      client_name: clients.find((c) => c.id === body.client_id)?.full_name ?? '',
      client_code: clients.find((c) => c.id === body.client_id)?.client_code ?? '',
    };
    payments = [newPayment, ...payments];
    return ok(newPayment, 201);
  }),

  http.patch('/api/v1/payments/:id/approve', async ({ params }) => {
    await delay(600);
    const idx = payments.findIndex((p) => p.id === params.id);
    if (idx === -1) return fail('Payment not found', 404);
    if (payments[idx].status !== 'PENDING') return fail('Payment is not pending', 409);
    payments[idx] = { ...payments[idx], status: 'APPROVED', journal_id: `je-mock-${Date.now()}` };
    return ok(payments[idx]);
  }),

  http.patch('/api/v1/payments/:id/reject', async ({ params }) => {
    await delay(400);
    const idx = payments.findIndex((p) => p.id === params.id);
    if (idx === -1) return fail('Payment not found', 404);
    payments[idx] = { ...payments[idx], status: 'REJECTED' };
    return ok(payments[idx]);
  }),

  // ── JOURNALS ─────────────────────────────────────────────────────────────
  http.get('/api/v1/journals', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit'))  || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;
    let filtered = journals;
    const refType = url.searchParams.get('reference_type');
    if (refType) filtered = filtered.filter((j) => j.reference_type === refType);
    return ok({ journals: paginate(filtered, limit, offset), limit, offset });
  }),

  http.get('/api/v1/journals/:id', async ({ params }) => {
    await delay(200);
    const j = journals.find((x) => x.id === params.id);
    if (!j) return fail('Journal not found', 404);
    return ok(j);
  }),

  http.post('/api/v1/journals', async ({ request }) => {
    await delay(600);
    const body = await request.json() as { narration: string; entry_date: string; lines: { account_id: string; debit: string; credit: string }[] };
    const totalDebit  = body.lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
    const totalCredit = body.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) return fail('Journal imbalance: debits must equal credits');
    const newJournal = {
      id: `je-${Date.now()}`,
      entry_date: body.entry_date,
      reference_type: 'MANUAL',
      reference_id: null,
      narration: body.narration,
      status: 'POSTED',
      created_at: new Date().toISOString(),
      lines: body.lines.map((l) => ({
        ...l,
        account_code: coa.find((a) => a.id === l.account_id)?.code ?? '',
        account_name: coa.find((a) => a.id === l.account_id)?.name ?? '',
      })),
    };
    journals = [newJournal, ...journals];
    return ok(newJournal, 201);
  }),

  // ── TRADES ───────────────────────────────────────────────────────────────
  http.get('/api/v1/trades', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit     = Number(url.searchParams.get('limit'))  || 20;
    const offset    = Number(url.searchParams.get('offset')) || 0;
    let filtered    = trades;
    const ticket    = url.searchParams.get('ticket');
    const symbol    = url.searchParams.get('symbol');
    const bookType  = url.searchParams.get('book_type');
    const posted    = url.searchParams.get('journal_posted');
    const startDate = url.searchParams.get('start_date');
    const endDate   = url.searchParams.get('end_date');
    if (ticket)   filtered = filtered.filter((t) => String(t.ticket).includes(ticket));
    if (symbol)   filtered = filtered.filter((t) => t.symbol === symbol);
    if (bookType) filtered = filtered.filter((t) => t.book_type === bookType);
    if (posted != null) filtered = filtered.filter((t) => t.journal_posted === (posted === 'true'));
    if (startDate) filtered = filtered.filter((t) => t.close_time >= startDate);
    if (endDate)   filtered = filtered.filter((t) => t.close_time <= endDate + 'T23:59:59Z');

    const totalVolume       = filtered.reduce((s, t) => s + t.volume, 0);
    const totalSpreadIncome = filtered.reduce((s, t) => s + t.spread_income, 0);
    const totalBBookPL      = filtered.filter((t) => t.book_type === 'B').reduce((s, t) => s - t.profit, 0);
    const totals = {
      volume:        Number(totalVolume.toFixed(2)),
      spread_income: Number(totalSpreadIncome.toFixed(2)),
      b_book_pl:     Number(totalBBookPL.toFixed(2)),
      net_broker_pl: Number((totalSpreadIncome + totalBBookPL).toFixed(2)),
    };

    return ok({ trades: paginate(filtered, limit, offset), limit, offset, totals });
  }),

  http.get('/api/v1/trades/:id', async ({ params }) => {
    await delay(200);
    const t = trades.find((x) => x.id === params.id);
    if (!t) return fail('Trade not found', 404);
    const linkedJournals     = journals.filter((j) => j.reference_id === t.id);
    const linkedCommissions  = ibComms.filter((c) => c.trade_id === t.id);
    return ok({ ...t, journals: linkedJournals, commissions: linkedCommissions });
  }),

  // ── REPORTS ───────────────────────────────────────────────────────────────
  http.get('/api/v1/reports/pnl', async () => {
    await delay(400);
    return ok(mockPnL);
  }),

  http.get('/api/v1/reports/balance-sheet', async () => {
    await delay(400);
    return ok(mockBalanceSheet);
  }),

  http.get('/api/v1/reports/client-ledger', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit'))  || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;
    return ok({ entries: paginate(mockLedger.entries, limit, offset), limit, offset });
  }),

  http.get('/api/v1/reports/reconciliation', async () => {
    await delay(300);
    return ok(mockReconciliation);
  }),

  // ── EOD ──────────────────────────────────────────────────────────────────
  http.get('/api/v1/eod/status/:date', async ({ params }) => {
    await delay(200);
    if (params.date === mockEODStatus.eod_date) return ok(mockEODStatus);
    return fail('No EOD record for this date', 404);
  }),

  http.post('/api/v1/eod/trigger', async ({ request }) => {
    await delay(800);
    const body = await request.json() as { date: string };
    if (body.date === mockEODStatus.eod_date) return fail('Date already locked', 409);
    return ok({ jobId: `eod-job-${Date.now()}`, message: 'EOD job queued successfully' });
  }),

  // ── IB COMMISSIONS ───────────────────────────────────────────────────────
  http.get('/api/v1/ib-commissions', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit'))  || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const status = url.searchParams.get('status');
    let filtered = ibComms;
    if (status) filtered = filtered.filter((c) => c.status === status);
    return ok({ commissions: paginate(filtered, limit, offset), limit, offset });
  }),

  http.get('/api/v1/ib-commissions/summary', async () => {
    await delay(200);
    return ok({ summary: mockIBCommissions.summary });
  }),

  http.post('/api/v1/ib-commissions/:ibId/payout', async ({ params }) => {
    await delay(700);
    const ibId = params.ibId as string;
    const pending = ibComms.filter((c) => c.ib_client_id === ibId && c.status === 'PENDING');
    if (!pending.length) return fail('No pending commissions for this IB', 400);
    const total = pending.reduce((s, c) => s + Number(c.amount), 0);
    ibComms = ibComms.map((c) => c.ib_client_id === ibId && c.status === 'PENDING' ? { ...c, status: 'PAID' } : c);
    return ok({ journalId: `je-ib-${Date.now()}`, totalPaid: total.toFixed(2) }, 201);
  }),

  // ── CHART OF ACCOUNTS ────────────────────────────────────────────────────
  http.get('/api/v1/chart-of-accounts', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    let filtered = coa;
    const type     = url.searchParams.get('type');
    const isActive = url.searchParams.get('is_active');
    if (type)     filtered = filtered.filter((a) => a.type === type);
    if (isActive != null) filtered = filtered.filter((a) => a.is_active === (isActive === 'true'));
    return ok({ accounts: filtered });
  }),

  http.get('/api/v1/chart-of-accounts/:id', async ({ params }) => {
    await delay(200);
    const a = coa.find((x) => x.id === params.id);
    if (!a) return fail('Account not found', 404);
    return ok({ ...a, total_debit: '45200.00', total_credit: '0.00', balance: '45200.00' });
  }),

  http.post('/api/v1/chart-of-accounts', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Record<string, string>;
    if (!body.code || !body.name || !body.type || !body.normal_balance) return fail('code, name, type, normal_balance required');
    if (coa.find((a) => a.code === body.code)) return fail('Account code already exists', 409);
    const newAcct = {
      id: `coa-${body.code}`, code: body.code, name: body.name,
      type: body.type, subtype: body.subtype ?? null,
      normal_balance: body.normal_balance, is_system: false, is_active: true,
    };
    coa = [...coa, newAcct];
    return ok(newAcct, 201);
  }),

  http.patch('/api/v1/chart-of-accounts/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as { name?: string; is_active?: boolean };
    const idx = coa.findIndex((a) => a.id === params.id);
    if (idx === -1) return fail('Account not found', 404);
    if (coa[idx].is_system && body.is_active === false) return fail('System accounts cannot be deactivated', 403);
    coa[idx] = { ...coa[idx], ...body };
    return ok(coa[idx]);
  }),

  // ── USERS ────────────────────────────────────────────────────────────────
  http.get('/api/v1/users', async () => {
    await delay(200);
    return ok({ users });
  }),

  http.get('/api/v1/users/roles', async () => {
    await delay(100);
    return ok(mockRoles);
  }),

  http.post('/api/v1/users', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string; full_name: string; role_id: string; password: string };
    if (!body.email || !body.full_name || !body.role_id) return fail('email, full_name, role_id required');
    if (users.find((u) => u.email === body.email)) return fail('Email already registered', 409);
    const role = mockRoles.roles.find((r) => r.id === body.role_id);
    const newUser = {
      id: `user-${Date.now()}`, email: body.email, full_name: body.full_name,
      role_id: body.role_id, role_name: role?.name ?? '', is_active: true,
      last_login: null as unknown as string, created_at: new Date().toISOString(),
    };
    users = [newUser, ...users];
    return ok(newUser, 201);
  }),

  http.patch('/api/v1/users/:id/deactivate', async ({ params }) => {
    await delay(400);
    const idx = users.findIndex((u) => u.id === params.id);
    if (idx === -1) return fail('User not found', 404);
    users[idx] = { ...users[idx], is_active: false };
    return ok(users[idx]);
  }),

  // ── PROFILE ──────────────────────────────────────────────────────────────
  http.get('/api/v1/profile', async () => {
    await delay(200);
    return ok(MOCK_USER);
  }),

  http.patch('/api/v1/profile', async ({ request }) => {
    await delay(400);
    const body = await request.json() as { full_name?: string };
    return ok({ ...MOCK_USER, ...body });
  }),

  http.post('/api/v1/profile/change-password', async ({ request }) => {
    await delay(600);
    const body = await request.json() as { current_password: string; new_password: string };
    if (body.current_password !== 'demo1234') return fail('Current password is incorrect', 400);
    if ((body.new_password ?? '').length < 8) return fail('Password must be at least 8 characters', 400);
    return ok({ message: 'Password updated successfully' });
  }),

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  http.get('/api/v1/notifications', async () => {
    await delay(150);
    return ok({ notifications });
  }),

  http.patch('/api/v1/notifications/:id/read', async ({ params }) => {
    await delay(150);
    const idx = notifications.findIndex((n) => n.id === params.id);
    if (idx !== -1) notifications[idx] = { ...notifications[idx], is_read: true };
    return ok(notifications[idx >= 0 ? idx : 0]);
  }),

  http.patch('/api/v1/notifications/read-all', async () => {
    await delay(200);
    notifications = notifications.map((n) => ({ ...n, is_read: true }));
    return ok({ message: 'All notifications marked as read' });
  }),

  // ── SETTINGS — SYMBOLS ───────────────────────────────────────────────────
  http.get('/api/v1/settings/symbols', async () => {
    await delay(200);
    return ok({ symbols });
  }),

  http.post('/api/v1/settings/symbols', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Record<string, string>;
    if (!body.symbol || !body.pip_value_usd || !body.broker_spread || !body.lp_spread || !body.asset_class)
      return fail('symbol, pip_value_usd, broker_spread, lp_spread, asset_class required');
    if (symbols.find((s) => s.symbol === body.symbol)) return fail('Symbol already exists', 409);
    const markup = (Number(body.broker_spread) - Number(body.lp_spread)).toFixed(1);
    const newSym = {
      id: `sym-${Date.now()}`, symbol: body.symbol, pip_value_usd: body.pip_value_usd,
      broker_spread: body.broker_spread, lp_spread: body.lp_spread, markup,
      contract_size: body.contract_size ?? '100000', asset_class: body.asset_class,
      is_active: true, effective_from: new Date().toISOString().slice(0, 10),
    };
    symbols = [...symbols, newSym];
    return ok(newSym, 201);
  }),

  http.patch('/api/v1/settings/symbols/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as Partial<typeof symbols[0]>;
    const idx = symbols.findIndex((s) => s.id === params.id);
    if (idx === -1) return fail('Symbol not found', 404);
    if (body.broker_spread != null || body.lp_spread != null) {
      const bs = Number(body.broker_spread ?? symbols[idx].broker_spread);
      const ls = Number(body.lp_spread ?? symbols[idx].lp_spread);
      body.markup = (bs - ls).toFixed(1);
    }
    symbols[idx] = { ...symbols[idx], ...body };
    return ok(symbols[idx]);
  }),

  // ── SETTINGS — GENERAL ───────────────────────────────────────────────────
  http.get('/api/v1/settings/general', async () => {
    await delay(200);
    return ok(generalSettings);
  }),

  http.patch('/api/v1/settings/general', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Partial<typeof generalSettings>;
    generalSettings = { ...generalSettings, ...body };
    return ok(generalSettings);
  }),

  // ── SETTINGS — GATEWAYS ──────────────────────────────────────────────────
  http.get('/api/v1/settings/gateways', async () => {
    await delay(200);
    return ok({ gateways });
  }),

  http.patch('/api/v1/settings/gateways/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as Partial<typeof gateways[0]>;
    const idx = gateways.findIndex((g) => g.id === params.id);
    if (idx === -1) return fail('Gateway not found', 404);
    gateways[idx] = { ...gateways[idx], ...body };
    return ok(gateways[idx]);
  }),

  // ── MT5 ACCOUNTS (used by client detail) ─────────────────────────────────
  http.get('/api/v1/mt5-accounts', async () => {
    await delay(200);
    return ok({ accounts: [], limit: 50, offset: 0 });
  }),

  // ── SYMBOLS (legacy endpoint) ─────────────────────────────────────────────
  http.get('/api/v1/symbols', async () => {
    await delay(200);
    return ok({ symbols });
  }),

  // ══════════════════════════════════════════════════════════════════════════
  // IB PORTAL ENDPOINTS  /api/v1/ib/*
  // ══════════════════════════════════════════════════════════════════════════

  ...((() => {
    let ibCommissions = [...mockIBCommissionEntries];
    let ibNotifications = [...mockIBNotifications];

    return [
      // ── IB AUTH ────────────────────────────────────────────────────────
      http.post('/api/v1/ib/auth/login', async ({ request }) => {
        await delay(400);
        const body = await request.json() as { email?: string; password?: string };
        if (body.email === 'ib@demo.com' && body.password === 'Demo@123456') {
          return HttpResponse.json({ success: true, data: { token: MOCK_IB_TOKEN, user: MOCK_IB_USER } });
        }
        return HttpResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }),

      // ── IB ME ──────────────────────────────────────────────────────────
      http.get('/api/v1/ib/me', async () => {
        await delay(200);
        return ok(MOCK_IB_USER);
      }),

      http.post('/api/v1/ib/me/change-password', async ({ request }) => {
        await delay(600);
        const body = await request.json() as { current_password: string; new_password: string };
        if (body.current_password !== 'Demo@123456') return fail('Current password is incorrect', 400);
        if ((body.new_password ?? '').length < 8) return fail('Password must be at least 8 characters', 400);
        return ok({ message: 'Password updated successfully' });
      }),

      // ── IB DASHBOARD ───────────────────────────────────────────────────
      http.get('/api/v1/ib/dashboard', async () => {
        await delay(300);
        const totalCommission  = ibCommissions.reduce((s, c) => s + c.amount, 0);
        const pendingCommission = ibCommissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
        const lockedCommission  = ibCommissions.filter((c) => c.status === 'LOCKED').reduce((s, c) => s + c.amount, 0);
        const paidCommission    = ibCommissions.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
        const activeThisMonth   = mockIBClients.filter((c) => c.is_active).length;
        const topClients = [...mockIBClients]
          .sort((a, b) => b.total_volume - a.total_volume)
          .slice(0, 5);
        return ok({
          metrics: {
            total_commission:    Number(totalCommission.toFixed(2)),
            pending_commission:  Number(pendingCommission.toFixed(2)),
            locked_commission:   Number(lockedCommission.toFixed(2)),
            paid_commission:     Number(paidCommission.toFixed(2)),
            total_clients:       mockIBClients.length,
            active_clients_month: activeThisMonth,
          },
          daily_stats: mockIBDailyStats,
          top_clients: topClients,
          sub_ibs:     mockIBSubIBs,
        });
      }),

      // ── IB COMMISSIONS ─────────────────────────────────────────────────
      http.get('/api/v1/ib/commissions', async ({ request }) => {
        await delay(250);
        const url    = new URL(request.url);
        const status = url.searchParams.get('status');
        let filtered = [...ibCommissions].reverse();
        if (status) filtered = filtered.filter((c) => c.status === status);
        const pending    = ibCommissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
        const locked     = ibCommissions.filter((c) => c.status === 'LOCKED').reduce((s, c) => s + c.amount, 0);
        const paidMonth  = ibCommissions.filter((c) => c.status === 'PAID' && c.date >= '2025-04-01').reduce((s, c) => s + c.amount, 0);
        return ok({
          commissions: filtered,
          summary: {
            total_pending:    Number(pending.toFixed(2)),
            total_locked:     Number(locked.toFixed(2)),
            total_paid_month: Number(paidMonth.toFixed(2)),
          },
        });
      }),

      // ── IB PAYOUT REQUEST ──────────────────────────────────────────────
      http.post('/api/v1/ib/payout/request', async ({ request }) => {
        await delay(700);
        const body = await request.json() as { gateway: string; details: string };
        if (!body.gateway) return fail('Payment method required', 400);
        const lockedAmount = ibCommissions
          .filter((c) => c.status === 'LOCKED')
          .reduce((s, c) => s + c.amount, 0);
        if (lockedAmount === 0) return fail('No locked commissions available for payout', 400);
        ibCommissions = ibCommissions.map((c) =>
          c.status === 'LOCKED' ? { ...c, status: 'PAID' } : c
        );
        return ok({ message: `Payout of $${lockedAmount.toFixed(2)} requested via ${body.gateway}`, amount: lockedAmount });
      }),

      // ── IB CLIENTS ─────────────────────────────────────────────────────
      http.get('/api/v1/ib/clients', async () => {
        await delay(250);
        return ok({ clients: mockIBClients });
      }),

      // ── IB NOTIFICATIONS ───────────────────────────────────────────────
      http.get('/api/v1/ib/notifications', async () => {
        await delay(150);
        return ok({ notifications: ibNotifications });
      }),

      http.patch('/api/v1/ib/notifications/:id/read', async ({ params }) => {
        await delay(100);
        const idx = ibNotifications.findIndex((n) => n.id === params.id);
        if (idx !== -1) ibNotifications[idx] = { ...ibNotifications[idx], is_read: true };
        return ok(ibNotifications[idx >= 0 ? idx : 0]);
      }),
    ];
  })()),

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT PORTAL ENDPOINTS  /api/v1/client/*
  // ══════════════════════════════════════════════════════════════════════════

  // In-memory state for client portal mutations
  ...((() => {
    let clientTransactions = [...mockClientTransactions];

    return [
      // ── CLIENT AUTH ─────────────────────────────────────────────────────
      http.post('/api/v1/client/auth/login', async ({ request }) => {
        await delay(400);
        const body = await request.json() as { email?: string; password?: string };
        if (body.email === 'client@demo.com' && body.password === 'Demo@123456') {
          return HttpResponse.json({
            success: true,
            data: { token: MOCK_CLIENT_TOKEN, user: MOCK_CLIENT_USER },
          });
        }
        return HttpResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }),

      // ── CLIENT ME ───────────────────────────────────────────────────────
      http.get('/api/v1/client/me', async () => {
        await delay(200);
        return ok(MOCK_CLIENT_USER);
      }),

      http.post('/api/v1/client/me/change-password', async ({ request }) => {
        await delay(600);
        const body = await request.json() as { current_password: string; new_password: string };
        if (body.current_password !== 'Demo@123456') return fail('Current password is incorrect', 400);
        if ((body.new_password ?? '').length < 8) return fail('Password must be at least 8 characters', 400);
        return ok({ message: 'Password updated successfully' });
      }),

      // ── CLIENT ACCOUNTS ─────────────────────────────────────────────────
      http.get('/api/v1/client/accounts', async () => {
        await delay(200);
        return ok({ accounts: mockClientAccounts });
      }),

      // ── CLIENT DASHBOARD ────────────────────────────────────────────────
      http.get('/api/v1/client/dashboard', async () => {
        await delay(300);
        const approvedDeposits = clientTransactions
          .filter((t) => t.type === 'DEPOSIT' && t.status === 'APPROVED')
          .reduce((s, t) => s + t.amount_usd, 0);
        const approvedWithdrawals = clientTransactions
          .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'APPROVED')
          .reduce((s, t) => s + t.amount_usd, 0);
        const totalBalance = mockClientAccounts.reduce((s, a) => s + a.balance, 0);
        const realizedPnl  = mockClientTrades.reduce((s, t) => s + t.profit, 0);
        return ok({
          metrics: {
            total_balance:    totalBalance,
            total_deposits:   approvedDeposits,
            total_withdrawals: approvedWithdrawals,
            realized_pnl:     Number(realizedPnl.toFixed(2)),
          },
          recent_transactions: [...clientTransactions].reverse().slice(0, 5),
          recent_trades:       [...mockClientTrades].reverse().slice(0, 5),
        });
      }),

      // ── CLIENT TRADES ────────────────────────────────────────────────────
      http.get('/api/v1/client/trades', async ({ request }) => {
        await delay(300);
        const url       = new URL(request.url);
        const limit     = Number(url.searchParams.get('limit'))  || 20;
        const offset    = Number(url.searchParams.get('offset')) || 0;
        const login     = url.searchParams.get('mt5_login');
        const symbol    = url.searchParams.get('symbol');
        const direction = url.searchParams.get('direction');
        const startDate = url.searchParams.get('start_date');
        const endDate   = url.searchParams.get('end_date');
        let filtered = [...mockClientTrades].reverse();
        if (login)     filtered = filtered.filter((t) => t.mt5_login === Number(login));
        if (symbol)    filtered = filtered.filter((t) => t.symbol === symbol);
        if (direction) filtered = filtered.filter((t) => t.direction === direction);
        if (startDate) filtered = filtered.filter((t) => t.close_time >= startDate);
        if (endDate)   filtered = filtered.filter((t) => t.close_time <= endDate + 'T23:59:59Z');
        return ok({ trades: filtered.slice(offset, offset + limit), total: filtered.length });
      }),

      // ── CLIENT TRANSACTIONS ──────────────────────────────────────────────
      http.get('/api/v1/client/transactions', async ({ request }) => {
        await delay(250);
        const url    = new URL(request.url);
        const limit  = Number(url.searchParams.get('limit'))  || 20;
        const offset = Number(url.searchParams.get('offset')) || 0;
        const type   = url.searchParams.get('type');
        const login  = url.searchParams.get('mt5_login');
        let filtered = [...clientTransactions].reverse();
        if (type)  filtered = filtered.filter((t) => t.type === type);
        if (login) filtered = filtered.filter((t) => t.mt5_login === Number(login));
        return ok({ transactions: filtered.slice(offset, offset + limit), total: filtered.length });
      }),

      http.post('/api/v1/client/transactions/deposit', async ({ request }) => {
        await delay(600);
        const body = await request.json() as { mt5_account_id: string; amount: number; gateway: string; reference: string };
        const acct = mockClientAccounts.find((a) => a.id === body.mt5_account_id);
        if (!acct) return fail('Account not found', 404);
        if (body.amount <= 0) return fail('Amount must be positive', 400);
        const newTxn = {
          id: `ctxn-${Date.now()}`,
          type: 'DEPOSIT',
          amount: body.amount,
          currency: acct.currency,
          amount_usd: body.amount,
          status: 'PENDING',
          gateway: body.gateway,
          reference: body.reference || `DEP-${Date.now()}`,
          mt5_login: acct.mt5_login,
          date: new Date().toISOString(),
          narration: `Deposit via ${body.gateway}`,
        };
        clientTransactions = [newTxn, ...clientTransactions];
        return ok(newTxn, 201);
      }),

      http.post('/api/v1/client/transactions/withdraw', async ({ request }) => {
        await delay(600);
        const body = await request.json() as { mt5_account_id: string; amount: number; gateway: string; details: string };
        const acct = mockClientAccounts.find((a) => a.id === body.mt5_account_id);
        if (!acct) return fail('Account not found', 404);
        if (body.amount > acct.balance) return fail('Insufficient balance', 400);
        if (body.amount <= 0) return fail('Amount must be positive', 400);
        const newTxn = {
          id: `ctxn-${Date.now()}`,
          type: 'WITHDRAWAL',
          amount: body.amount,
          currency: acct.currency,
          amount_usd: body.amount,
          status: 'PENDING',
          gateway: body.gateway,
          reference: `WD-${Date.now()}`,
          mt5_login: acct.mt5_login,
          date: new Date().toISOString(),
          narration: body.details || 'Withdrawal request',
        };
        clientTransactions = [newTxn, ...clientTransactions];
        return ok(newTxn, 201);
      }),

      // ── CLIENT STATEMENT ─────────────────────────────────────────────────
      http.get('/api/v1/client/statement', async ({ request }) => {
        await delay(400);
        const url       = new URL(request.url);
        const login     = Number(url.searchParams.get('mt5_login'));
        const startDate = url.searchParams.get('start') ?? '';
        const endDate   = url.searchParams.get('end')   ?? '';
        const acct = mockClientAccounts.find((a) => a.mt5_login === login) ?? mockClientAccounts[0];
        const txns = clientTransactions.filter((t) => {
          if (t.mt5_login !== acct.mt5_login) return false;
          if (startDate && t.date < startDate) return false;
          if (endDate   && t.date > endDate + 'T23:59:59Z') return false;
          return true;
        });
        const periodTrades = mockClientTrades.filter((t) => {
          if (t.mt5_login !== acct.mt5_login) return false;
          if (startDate && t.close_time < startDate) return false;
          if (endDate   && t.close_time > endDate + 'T23:59:59Z') return false;
          return true;
        });
        const netDeposits = txns.filter((t) => t.type === 'DEPOSIT' && t.status === 'APPROVED').reduce((s, t) => s + t.amount_usd, 0);
        const netWithdrawals = txns.filter((t) => t.type === 'WITHDRAWAL' && t.status === 'APPROVED').reduce((s, t) => s + t.amount_usd, 0);
        const totalPnl = periodTrades.reduce((s, t) => s + t.profit, 0);
        const openingBalance = acct.balance - netDeposits + netWithdrawals - totalPnl;
        return ok({
          account:         acct,
          period:          { start: startDate, end: endDate },
          opening_balance: Number(Math.max(0, openingBalance).toFixed(2)),
          closing_balance: acct.balance,
          transactions:    txns,
          trades:          periodTrades,
          trade_count:     periodTrades.length,
          total_pnl:       Number(totalPnl.toFixed(2)),
        });
      }),
    ];
  })()),
];
