// Module 2: Payments (Deposits & Withdrawals)
// GET  /payments                list with filters
// GET  /payments/:id            detail
// POST /payments                create pending payment
// PATCH /payments/:id/approve   approve → post journal + client_ledger
// PATCH /payments/:id/reject    reject

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';
import { postDeposit, postWithdrawal, appendClientLedger } from '../services/journal.service';

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
paymentsRouter.get('/',
  requirePermission('payments', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { status, payment_type, mt5_account_id } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT p.*, ma.mt5_login, c.full_name AS client_name
         FROM payments p
         JOIN mt5_accounts ma ON p.mt5_account_id = ma.id
         LEFT JOIN clients c  ON ma.client_id = c.id
         WHERE p.tenant_id = $1
           AND ($2::text     IS NULL OR p.status       = $2)
           AND ($3::text     IS NULL OR p.payment_type = $3)
           AND ($4::uuid     IS NULL OR p.mt5_account_id = $4::uuid)
         ORDER BY p.created_at DESC
         LIMIT $5 OFFSET $6`,
        [tenantId, status ?? null, payment_type ?? null, mt5_account_id ?? null, limit, offset]
      );
      return ok(res, { payments: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
paymentsRouter.get('/:id',
  requirePermission('payments', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [payment] } = await db.query(
        `SELECT p.*, ma.mt5_login, c.full_name AS client_name
         FROM payments p
         JOIN mt5_accounts ma ON p.mt5_account_id = ma.id
         LEFT JOIN clients c  ON ma.client_id = c.id
         WHERE p.id = $1 AND p.tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!payment) return fail(res, 'Payment not found', 404);
      return ok(res, payment);
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create (PENDING) ──────────────────────────────────────────────────────────
paymentsRouter.post('/',
  requirePermission('payments', 'view'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { mt5_account_id, payment_type, amount, currency, source, narration } =
      req.body as Record<string, string>;

    if (!mt5_account_id || !payment_type || !amount || !currency) {
      return fail(res, 'mt5_account_id, payment_type, amount, currency are required');
    }
    if (!['DEPOSIT', 'WITHDRAWAL'].includes(payment_type)) {
      return fail(res, 'payment_type must be DEPOSIT or WITHDRAWAL');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Verify account belongs to tenant
      const { rows: [acct] } = await db.query(
        `SELECT id FROM mt5_accounts WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
        [mt5_account_id, tenantId]
      );
      if (!acct) return fail(res, 'MT5 account not found', 404);

      const amt = parseFloat(amount);
      const { rows: [payment] } = await db.query(
        `INSERT INTO payments
           (tenant_id, mt5_account_id, payment_type, amount, currency,
            amount_usd, exchange_rate, source, status, narration)
         VALUES ($1,$2,$3,$4,$5,$4,1.0,$6,'PENDING',$7)
         RETURNING *`,
        [tenantId, mt5_account_id, payment_type, amt,
         currency, source ?? 'MANUAL', narration ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'payments',
        recordId: payment.id, newValues: payment, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, payment, 201);
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);

// ── Approve ───────────────────────────────────────────────────────────────────
paymentsRouter.patch('/:id/approve',
  requirePermission('payments', 'approve'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [payment] } = await db.query(
        `SELECT p.*, ma.currency AS acct_currency, ma.id AS acct_id
         FROM payments p
         JOIN mt5_accounts ma ON p.mt5_account_id = ma.id
         WHERE p.id = $1 AND p.tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!payment)              return fail(res, 'Payment not found', 404);
      if (payment.status !== 'PENDING') return fail(res, `Cannot approve ${payment.status} payment`, 409);

      const today     = new Date().toISOString().slice(0, 10);
      const amountUsd = parseFloat(payment.amount);
      const isDeposit = payment.payment_type === 'DEPOSIT';

      // Post journal
      const journalId = isDeposit
        ? await postDeposit(db, tenantId, today, payment.id, amountUsd,
            `Deposit approved: ${payment.narration ?? payment.id}`, userId)
        : await postWithdrawal(db, tenantId, today, payment.id, amountUsd,
            `Withdrawal approved: ${payment.narration ?? payment.id}`, userId);

      // Update client ledger
      await appendClientLedger(
        db, tenantId, payment.mt5_account_id,
        payment.payment_type,
        isDeposit ? amountUsd : -amountUsd,
        payment.currency,
        payment.id, 'PAYMENT',
        journalId,
        payment.narration ?? payment.payment_type
      );

      // Update payment record
      const { rows: [updated] } = await db.query(
        `UPDATE payments
         SET status = 'APPROVED', approved_by = $3, approved_at = NOW(), journal_id = $4
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId, userId, journalId]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'APPROVE', module: 'payments',
        recordId: payment.id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'APPROVED', journalId },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, updated);
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);

// ── Reject ────────────────────────────────────────────────────────────────────
paymentsRouter.patch('/:id/reject',
  requirePermission('payments', 'approve'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { reason } = req.body as { reason?: string };
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [payment] } = await db.query(
        `SELECT * FROM payments WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!payment)                    return fail(res, 'Payment not found', 404);
      if (payment.status !== 'PENDING') return fail(res, `Cannot reject ${payment.status} payment`, 409);

      const { rows: [updated] } = await db.query(
        `UPDATE payments
         SET status = 'REJECTED', approved_by = $3, approved_at = NOW(),
             narration = COALESCE($4, narration)
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId, userId, reason ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'REJECT', module: 'payments',
        recordId: payment.id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'REJECTED', reason },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, updated);
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);
