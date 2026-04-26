// Module 11: Chart of Accounts
// GET  /chart-of-accounts         list (filterable by type, is_system)
// GET  /chart-of-accounts/:id     detail with current balance
// POST /chart-of-accounts         create custom account (non-system)
// PATCH /chart-of-accounts/:id    update name / is_active (system accounts: name only)

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';

export const coaRouter = Router();
coaRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
coaRouter.get('/',
  requirePermission('system_config', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { type, is_system, is_active } = req.query as Record<string, string>;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT coa.*,
           parent.code AS parent_code,
           parent.name AS parent_name
         FROM chart_of_accounts coa
         LEFT JOIN chart_of_accounts parent ON coa.parent_id = parent.id
         WHERE coa.tenant_id = $1
           AND ($2::text IS NULL OR coa.type      = $2)
           AND ($3::bool IS NULL OR coa.is_system  = $3::bool)
           AND ($4::bool IS NULL OR coa.is_active  = $4::bool)
         ORDER BY coa.code`,
        [
          tenantId,
          type      ?? null,
          is_system != null ? is_system === 'true' : null,
          is_active != null ? is_active === 'true' : null,
        ]
      );
      return ok(res, { accounts: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail with running balance ───────────────────────────────────────────────
coaRouter.get('/:id',
  requirePermission('system_config', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [account] } = await db.query(
        `SELECT * FROM chart_of_accounts WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!account) return fail(res, 'Account not found', 404);

      // Current balance from journal_lines
      const { rows: [bal] } = await db.query(
        `SELECT
           SUM(jl.debit)  AS total_debit,
           SUM(jl.credit) AS total_credit,
           SUM(
             CASE $2 WHEN 'DEBIT'
               THEN jl.debit  - jl.credit
               ELSE jl.credit - jl.debit
             END
           ) AS balance
         FROM journal_lines jl
         JOIN journal_entries je ON jl.journal_id = je.id
         WHERE jl.account_id = $1 AND je.tenant_id = $3`,
        [account.id, account.normal_balance, tenantId]
      );

      return ok(res, { ...account, ...bal });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create custom account ─────────────────────────────────────────────────────
coaRouter.post('/',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { code, name, type, subtype, normal_balance, parent_id } =
      req.body as Record<string, string>;

    if (!code || !name || !type || !normal_balance) {
      return fail(res, 'code, name, type, and normal_balance are required');
    }
    if (!['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'].includes(type)) {
      return fail(res, 'type must be ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE');
    }
    if (!['DEBIT','CREDIT'].includes(normal_balance)) {
      return fail(res, 'normal_balance must be DEBIT or CREDIT');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [account] } = await db.query(
        `INSERT INTO chart_of_accounts
           (tenant_id, code, name, type, subtype, normal_balance, parent_id, is_system)
         VALUES ($1,$2,$3,$4,$5,$6,$7, false)
         RETURNING *`,
        [tenantId, code, name, type, subtype ?? null,
         normal_balance, parent_id ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'system_config',
        recordId: account.id, newValues: account, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, account, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'Account code already exists', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Update ────────────────────────────────────────────────────────────────────
// System accounts: name-only update. Custom accounts: name + is_active.
coaRouter.patch('/:id',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { name, is_active } = req.body as Record<string, string>;
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [before] } = await db.query(
        `SELECT * FROM chart_of_accounts WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!before) return fail(res, 'Account not found', 404);

      // Prevent deactivating system accounts
      if (before.is_system && is_active === 'false') {
        return fail(res, 'System accounts cannot be deactivated', 403);
      }

      const { rows: [updated] } = await db.query(
        `UPDATE chart_of_accounts
         SET name      = COALESCE($3, name),
             is_active = COALESCE($4::bool, is_active)
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId, name ?? null,
         !before.is_system && is_active != null ? is_active === 'true' : null]
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
