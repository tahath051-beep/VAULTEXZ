// Module 9: MT5 Accounts
// GET  /mt5-accounts            list for tenant (with current balance)
// GET  /mt5-accounts/:id        detail + recent ledger entries
// POST /mt5-accounts            create and link to client
// PATCH /mt5-accounts/:id       update book_type, leverage, is_active

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';

export const mt5AccountsRouter = Router();
mt5AccountsRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
mt5AccountsRouter.get('/',
  requirePermission('client_ledger', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { client_id, book_type, is_active } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT ma.*,
           c.full_name   AS client_name,
           c.client_code,
           (SELECT balance_after
            FROM client_ledger
            WHERE mt5_account_id = ma.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1) AS current_balance
         FROM mt5_accounts ma
         LEFT JOIN clients c ON ma.client_id = c.id AND c.tenant_id = ma.tenant_id
         WHERE ma.tenant_id = $1
           AND ($2::uuid IS NULL OR ma.client_id = $2::uuid)
           AND ($3::text IS NULL OR ma.book_type  = $3)
           AND ($4::bool IS NULL OR ma.is_active  = $4::bool)
         ORDER BY ma.created_at DESC
         LIMIT $5 OFFSET $6`,
        [
          tenantId,
          client_id ?? null,
          book_type ?? null,
          is_active != null ? is_active === 'true' : null,
          limit, offset,
        ]
      );
      return ok(res, { accounts: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
mt5AccountsRouter.get('/:id',
  requirePermission('client_ledger', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [account] } = await db.query(
        `SELECT ma.*,
           c.full_name AS client_name, c.client_code
         FROM mt5_accounts ma
         LEFT JOIN clients c ON ma.client_id = c.id
         WHERE ma.id = $1 AND ma.tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!account) return fail(res, 'MT5 account not found', 404);

      // Recent ledger entries
      const { rows: ledger } = await db.query(
        `SELECT entry_type, amount, currency, balance_after, narration, created_at
         FROM client_ledger
         WHERE mt5_account_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 20`,
        [req.params.id]
      );
      return ok(res, { ...account, recent_ledger: ledger });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create ────────────────────────────────────────────────────────────────────
mt5AccountsRouter.post('/',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const {
      client_id, mt5_login, account_type, currency,
      leverage, book_type, is_islamic,
    } = req.body as Record<string, string>;

    if (!mt5_login || !currency || !book_type) {
      return fail(res, 'mt5_login, currency, and book_type are required');
    }
    if (!['A', 'B'].includes(book_type)) {
      return fail(res, 'book_type must be A or B');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      if (client_id) {
        const { rows: [c] } = await db.query(
          `SELECT id FROM clients WHERE id = $1 AND tenant_id = $2`,
          [client_id, tenantId]
        );
        if (!c) return fail(res, 'Client not found', 404);
      }

      const { rows: [account] } = await db.query(
        `INSERT INTO mt5_accounts
           (tenant_id, client_id, mt5_login, account_type, currency,
            leverage, book_type, is_islamic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          tenantId,
          client_id   ?? null,
          Number(mt5_login),
          account_type ?? 'STANDARD',
          currency.toUpperCase(),
          Number(leverage) || 100,
          book_type,
          is_islamic === 'true',
        ]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'system_config',
        recordId: account.id, newValues: account, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, account, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'MT5 login already registered', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Update ────────────────────────────────────────────────────────────────────
mt5AccountsRouter.patch('/:id',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { book_type, leverage, is_active, client_id } =
      req.body as Record<string, string>;

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [before] } = await db.query(
        `SELECT * FROM mt5_accounts WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!before) return fail(res, 'MT5 account not found', 404);

      if (book_type && !['A', 'B'].includes(book_type)) {
        return fail(res, 'book_type must be A or B');
      }

      const { rows: [updated] } = await db.query(
        `UPDATE mt5_accounts
         SET book_type  = COALESCE($3, book_type),
             leverage   = COALESCE($4::int, leverage),
             is_active  = COALESCE($5::bool, is_active),
             client_id  = COALESCE($6::uuid, client_id)
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId, book_type ?? null,
         leverage ?? null, is_active ?? null, client_id ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'UPDATE', module: 'system_config',
        recordId: updated.id, oldValues: before, newValues: updated, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, updated);
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);
