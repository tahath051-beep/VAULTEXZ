// Module 5: IB Commissions
// GET  /ib-commissions                list commission ledger entries
// GET  /ib-commissions/summary        per-IB totals by status
// POST /ib-commissions/:ibId/payout   approve payout → post IB_PAYOUT journal

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';
import { postIBPayout }      from '../services/journal.service';

export const ibRouter = Router();
ibRouter.use(authenticate);

// ── List commission ledger ────────────────────────────────────────────────────
ibRouter.get('/',
  requirePermission('ib_commissions', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { ib_id, status, start_date, end_date } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT icl.*,
           ib.ib_code, ib.full_name AS ib_name, ib.level,
           t.mt5_ticket, t.symbol
         FROM ib_commission_ledger icl
         JOIN ibs   ib ON icl.ib_id    = ib.id
         JOIN trades t  ON icl.trade_id = t.id
         WHERE icl.tenant_id = $1
           AND ($2::uuid IS NULL OR icl.ib_id  = $2::uuid)
           AND ($3::text IS NULL OR icl.status  = $3)
           AND ($4::date IS NULL OR icl.created_at::date >= $4::date)
           AND ($5::date IS NULL OR icl.created_at::date <= $5::date)
         ORDER BY icl.created_at DESC
         LIMIT $6 OFFSET $7`,
        [tenantId, ib_id ?? null, status ?? null, start_date ?? null, end_date ?? null,
         limit, offset]
      );
      return ok(res, { commissions: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Per-IB summary ────────────────────────────────────────────────────────────
ibRouter.get('/summary',
  requirePermission('ib_commissions', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT ib.id, ib.ib_code, ib.full_name, ib.level,
           SUM(CASE WHEN icl.status = 'PENDING' THEN icl.gross_amount ELSE 0 END) AS pending_total,
           SUM(CASE WHEN icl.status = 'LOCKED'  THEN icl.gross_amount ELSE 0 END) AS locked_total,
           SUM(CASE WHEN icl.status = 'PAID'    THEN icl.gross_amount ELSE 0 END) AS paid_total,
           MAX(icl.settlement_date) AS next_settlement
         FROM ibs ib
         LEFT JOIN ib_commission_ledger icl
           ON icl.ib_id = ib.id AND icl.tenant_id = ib.tenant_id
         WHERE ib.tenant_id = $1 AND ib.is_active = true
         GROUP BY ib.id, ib.ib_code, ib.full_name, ib.level
         ORDER BY ib.level, ib.ib_code`,
        [tenantId]
      );
      return ok(res, { ibs: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Approve payout ────────────────────────────────────────────────────────────
// Posts IB_PAYOUT journal and moves all PENDING commissions to PAID
ibRouter.post('/:ibId/payout',
  requirePermission('ib_commissions', 'approve'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { ibId } = req.params;

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Verify IB belongs to tenant
      const { rows: [ib] } = await db.query(
        `SELECT id, ib_code, full_name FROM ibs
         WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
        [ibId, tenantId]
      );
      if (!ib) return fail(res, 'IB not found', 404);

      // Sum all PENDING commissions for this IB
      const { rows: [totals] } = await db.query(
        `SELECT COALESCE(SUM(gross_amount), 0) AS total,
                COUNT(*) AS count
         FROM ib_commission_ledger
         WHERE tenant_id = $1 AND ib_id = $2 AND status = 'PENDING'`,
        [tenantId, ibId]
      );

      const total = parseFloat(totals.total);
      if (total <= 0) return fail(res, 'No pending commissions to pay out', 409);

      const today = new Date().toISOString().slice(0, 10);

      // Post IB_PAYOUT journal: DR IB Payable (2200) / CR Operational Cash (1100)
      const journalId = await postIBPayout(
        db, tenantId, today, ibId, total,
        `IB payout: ${ib.ib_code} ${ib.full_name}`,
        userId
      );

      // Mark commissions as PAID
      await db.query(
        `UPDATE ib_commission_ledger
         SET status = 'PAID', paid_date = $3, journal_id = $4
         WHERE tenant_id = $1 AND ib_id = $2 AND status = 'PENDING'`,
        [tenantId, ibId, today, journalId]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'APPROVE', module: 'ib_commissions',
        recordId: ibId,
        newValues: { total, count: totals.count, journalId },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, { ibId, total, count: Number(totals.count), journalId });
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);
