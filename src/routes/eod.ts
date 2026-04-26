// Module 7: EOD Processing
// POST /eod/trigger        queue an EOD run for a given date (CFO / system_config)
// GET  /eod/status/:date   fetch processing log for a date

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';
import { scheduleEOD }       from '../jobs/eod/eod.queue';

export const eodRouter = Router();
eodRouter.use(authenticate);

// ── Trigger EOD ───────────────────────────────────────────────────────────────
eodRouter.post('/trigger',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { date } = req.body as { date?: string };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail(res, 'date is required in YYYY-MM-DD format');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Check if the day is already LOCKED
      const { rows: [log] } = await db.query(
        `SELECT status FROM eod_processing_log
         WHERE tenant_id = $1 AND eod_date = $2`,
        [tenantId, date]
      );
      if (log?.status === 'LOCKED') {
        return fail(res, `EOD for ${date} is already LOCKED — cannot re-run`, 409);
      }

      await scheduleEOD(tenantId, date, userId);

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'system_config',
        newValues: { action: 'EOD_TRIGGER', date },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, { queued: true, date, tenantId });
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);

// ── Status ────────────────────────────────────────────────────────────────────
eodRouter.get('/status/:date',
  requirePermission('pnl_statement', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail(res, 'date must be in YYYY-MM-DD format');
    }

    const db = await pool.connect();
    try {
      const { rows: [log] } = await db.query(
        `SELECT epl.*,
           u.full_name AS locked_by_name
         FROM eod_processing_log epl
         LEFT JOIN users u ON epl.locked_by::uuid = u.id
         WHERE epl.tenant_id = $1 AND epl.eod_date = $2`,
        [tenantId, date]
      );

      if (!log) {
        return ok(res, { date, status: 'NOT_STARTED', step_results: [] });
      }

      return ok(res, log);
    } catch (err) { next(err); } finally { db.release(); }
  }
);
