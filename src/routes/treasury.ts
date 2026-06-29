import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Banks ---
router.get('/banks', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, COUNT(ba.id) AS account_count
       FROM banks b LEFT JOIN bank_accounts ba ON ba.bank_id = b.id
       WHERE b.tenant_id=$1 GROUP BY b.id ORDER BY b.name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/banks', async (req, res, next) => {
  try {
    const { name, swift_code, country } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO banks (tenant_id, name, swift_code, country) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user!.tenantId, name, swift_code, country]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Bank Accounts ---
router.get('/bank-accounts', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ba.*, b.name AS bank_name
       FROM bank_accounts ba JOIN banks b ON b.id = ba.bank_id
       WHERE ba.tenant_id=$1 ORDER BY b.name, ba.currency`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/bank-accounts', async (req, res, next) => {
  try {
    const { bank_id, account_name, account_number, iban, currency, gl_account_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bank_accounts (tenant_id, bank_id, account_name, account_number, iban, currency, gl_account_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user!.tenantId, bank_id, account_name, account_number, iban, currency, gl_account_id]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Payment Providers ---
router.get('/payment-providers', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, tenant_id, name, provider_type, currencies, fee_percent, fee_fixed, is_active, created_at
       FROM payment_providers WHERE tenant_id=$1 ORDER BY name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/payment-providers', async (req, res, next) => {
  try {
    const { name, provider_type, currencies, fee_percent, fee_fixed, gl_account_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payment_providers (tenant_id, name, provider_type, currencies, fee_percent, fee_fixed, gl_account_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,provider_type,currencies,fee_percent,fee_fixed,is_active`,
      [req.user!.tenantId, name, provider_type, currencies, fee_percent ?? 0, fee_fixed ?? 0, gl_account_id]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Internal Transfers ---
router.get('/transfers', async (req, res, next) => {
  try {
    const { status } = req.query;
    let q = `SELECT it.*, u.full_name AS created_by_name
             FROM internal_transfers it
             LEFT JOIN users u ON u.id = it.created_by
             WHERE it.tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (status) { params.push(status); q += ` AND it.status=$${params.length}`; }
    q += ' ORDER BY it.created_at DESC LIMIT 100';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/transfers', async (req, res, next) => {
  try {
    const { transfer_type, from_account_id, from_type, to_account_id, to_type,
            amount, currency, exchange_rate, fee, reference, narration } = req.body;
    const amount_base = parseFloat(amount) * parseFloat(exchange_rate ?? 1);
    const { rows } = await pool.query(
      `INSERT INTO internal_transfers
         (tenant_id, transfer_type, from_account_id, from_type, to_account_id, to_type,
          amount, currency, exchange_rate, amount_base, fee, reference, narration, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user!.tenantId, transfer_type, from_account_id, from_type, to_account_id, to_type,
       amount, currency, exchange_rate ?? 1, amount_base, fee ?? 0, reference, narration, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.post('/transfers/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE internal_transfers SET status='COMPLETED', approved_by=$1, approved_at=NOW()
       WHERE id=$2 AND tenant_id=$3 AND status='PENDING' RETURNING *`,
      [req.user!.sub, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Bank Reconciliation ---
router.get('/reconciliations', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT br.*, ba.account_name, ba.currency
       FROM bank_reconciliations br
       JOIN bank_accounts ba ON ba.id = br.bank_account_id
       WHERE br.tenant_id=$1 ORDER BY br.recon_date DESC`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/reconciliations', async (req, res, next) => {
  try {
    const { bank_account_id, recon_date, statement_balance, system_balance, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bank_reconciliations
         (tenant_id, bank_account_id, recon_date, statement_balance, system_balance, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id, bank_account_id, recon_date)
       DO UPDATE SET statement_balance=$4, system_balance=$5, notes=$6
       RETURNING *`,
      [req.user!.tenantId, bank_account_id, recon_date, statement_balance, system_balance, notes]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

