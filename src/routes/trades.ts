// Module 8: Trades
// GET  /trades                list with filters (symbol, date, book_type, journal_posted)
// GET  /trades/:id            detail
// POST /trades/:id/correction post a trade correction (offsetting journal, no DELETE)

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';
import { postTradeCorrection } from '../services/journal.service';
import type { JournalLineInput } from '../services/journal.service';

export const tradesRouter = Router();
tradesRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
tradesRouter.get('/',
  requirePermission('journal_entries', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const {
      symbol, book_type, journal_posted,
      start_date, end_date, mt5_account_id,
    } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT t.*,
           ma.mt5_login,
           c.full_name  AS client_name,
           c.client_code
         FROM trades t
         JOIN mt5_accounts ma ON t.mt5_account_id = ma.id
         LEFT JOIN clients c  ON ma.client_id      = c.id
         WHERE t.tenant_id = $1
           AND ($2::text  IS NULL OR t.symbol        = $2)
           AND ($3::text  IS NULL OR t.book_type      = $3)
           AND ($4::bool  IS NULL OR t.journal_posted = $4::bool)
           AND ($5::uuid  IS NULL OR t.mt5_account_id = $5::uuid)
           AND ($6::date  IS NULL OR t.close_time::date >= $6::date)
           AND ($7::date  IS NULL OR t.close_time::date <= $7::date)
         ORDER BY t.close_time DESC, t.created_at DESC
         LIMIT $8 OFFSET $9`,
        [
          tenantId,
          symbol        ?? null,
          book_type     ?? null,
          journal_posted != null ? journal_posted === 'true' : null,
          mt5_account_id ?? null,
          start_date    ?? null,
          end_date      ?? null,
          limit, offset,
        ]
      );
      return ok(res, { trades: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
tradesRouter.get('/:id',
  requirePermission('journal_entries', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [trade] } = await db.query(
        `SELECT t.*,
           ma.mt5_login,
           c.full_name  AS client_name,
           c.client_code,
           je.id        AS journal_id,
           je.entry_date
         FROM trades t
         JOIN mt5_accounts  ma ON t.mt5_account_id = ma.id
         LEFT JOIN clients  c  ON ma.client_id      = c.id
         LEFT JOIN journal_entries je
           ON je.reference_id = t.id::text
           AND je.tenant_id   = t.tenant_id
           AND je.reference_type = 'TRADE_CLOSE'
         WHERE t.id = $1 AND t.tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!trade) return fail(res, 'Trade not found', 404);
      return ok(res, trade);
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Correction ────────────────────────────────────────────────────────────────
// Rule 6: corrections create a new offsetting journal entry — never modify originals
tradesRouter.post('/:id/correction',
  requirePermission('journal_entries', 'create'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { narration, lines } =
      req.body as { narration?: string; lines?: JournalLineInput[] };

    if (!narration || !Array.isArray(lines) || lines.length < 2) {
      return fail(res, 'narration and at least 2 correction lines are required');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [trade] } = await db.query(
        `SELECT * FROM trades
         WHERE id = $1 AND tenant_id = $2 AND journal_posted = true`,
        [req.params.id, tenantId]
      );
      if (!trade) return fail(res, 'Posted trade not found', 404);

      const today = new Date().toISOString().slice(0, 10);
      const journalId = await postTradeCorrection(
        db, tenantId, today, trade.id, lines,
        narration, userId
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'journal_entries',
        recordId: journalId,
        newValues: { type: 'TRADE_CORRECTION', originalTradeId: trade.id, narration },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, { journalId, originalTradeId: trade.id }, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.message?.includes('Journal imbalance')) return fail(res, err.message);
      next(err);
    } finally { db.release(); }
  }
);
