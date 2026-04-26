// Module 1: Clients
// GET  /clients              list with MT5 account count
// GET  /clients/:id          detail + MT5 accounts + current balance
// POST /clients              create
// PATCH /clients/:id         update (name, email, country, kyc_status, ib_id)

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

// ── List ─────────────────────────────────────────────────────────────────────
clientsRouter.get('/',
  requirePermission('client_ledger', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT c.*,
                COUNT(ma.id)::int AS mt5_account_count
         FROM clients c
         LEFT JOIN mt5_accounts ma
           ON ma.client_id = c.id AND ma.tenant_id = c.tenant_id
         WHERE c.tenant_id = $1
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
      );
      return ok(res, { clients: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
clientsRouter.get('/:id',
  requirePermission('client_ledger', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [client] } = await db.query(
        `SELECT * FROM clients WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!client) return fail(res, 'Client not found', 404);

      const { rows: accounts } = await db.query(
        `SELECT ma.*,
           (SELECT balance_after
            FROM client_ledger
            WHERE mt5_account_id = ma.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1) AS current_balance
         FROM mt5_accounts ma
         WHERE ma.client_id = $1 AND ma.tenant_id = $2
         ORDER BY ma.created_at`,
        [client.id, tenantId]
      );
      return ok(res, { ...client, mt5_accounts: accounts });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create ────────────────────────────────────────────────────────────────────
clientsRouter.post('/',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { client_code, full_name, email, country, ib_id } = req.body as Record<string, string>;

    if (!client_code?.trim() || !full_name?.trim()) {
      return fail(res, 'client_code and full_name are required');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [client] } = await db.query(
        `INSERT INTO clients (tenant_id, client_code, full_name, email, country, ib_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [tenantId, client_code.trim(), full_name.trim(),
         email ?? null, country ?? null, ib_id ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'clients',
        recordId: client.id, newValues: client, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, client, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'client_code already exists', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Update ────────────────────────────────────────────────────────────────────
clientsRouter.patch('/:id',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [before] } = await db.query(
        `SELECT * FROM clients WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!before) return fail(res, 'Client not found', 404);

      const { full_name, email, country, kyc_status, ib_id } =
        req.body as Record<string, string | null>;

      const { rows: [updated] } = await db.query(
        `UPDATE clients
         SET full_name  = COALESCE($3, full_name),
             email      = COALESCE($4, email),
             country    = COALESCE($5, country),
             kyc_status = COALESCE($6, kyc_status),
             ib_id      = COALESCE($7::uuid, ib_id)
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId, full_name, email, country, kyc_status, ib_id]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'UPDATE', module: 'clients',
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
