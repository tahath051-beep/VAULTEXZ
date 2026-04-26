// Module 3: Journal Entries
// GET  /journals              list (filterable by date, reference_type)
// GET  /journals/:id          detail + lines
// POST /journals              create manual balanced entry (CFO / Senior Accountant)

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';
import { postManualJournal } from '../services/journal.service';
import type { JournalLineInput } from '../services/journal.service';

export const journalsRouter = Router();
journalsRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
journalsRouter.get('/',
  requirePermission('journal_entries', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { reference_type, start_date, end_date } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT je.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', jl.id, 'account_id', jl.account_id,
                 'account_code', coa.code, 'account_name', coa.name,
                 'debit', jl.debit, 'credit', jl.credit,
                 'currency', jl.currency, 'narration', jl.narration
               ) ORDER BY jl.id
             ) FILTER (WHERE jl.id IS NOT NULL),
             '[]'
           ) AS lines
         FROM journal_entries je
         LEFT JOIN journal_lines jl ON jl.journal_id = je.id AND jl.tenant_id = je.tenant_id
         LEFT JOIN chart_of_accounts coa ON jl.account_id = coa.id
         WHERE je.tenant_id = $1
           AND ($2::text IS NULL OR je.reference_type = $2)
           AND ($3::date IS NULL OR je.entry_date >= $3::date)
           AND ($4::date IS NULL OR je.entry_date <= $4::date)
         GROUP BY je.id
         ORDER BY je.entry_date DESC, je.created_at DESC
         LIMIT $5 OFFSET $6`,
        [tenantId, reference_type ?? null, start_date ?? null, end_date ?? null, limit, offset]
      );
      return ok(res, { journals: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
journalsRouter.get('/:id',
  requirePermission('journal_entries', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [journal] } = await db.query(
        `SELECT je.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', jl.id, 'account_id', jl.account_id,
                 'account_code', coa.code, 'account_name', coa.name,
                 'debit', jl.debit, 'credit', jl.credit,
                 'currency', jl.currency, 'narration', jl.narration
               ) ORDER BY jl.id
             ) FILTER (WHERE jl.id IS NOT NULL),
             '[]'
           ) AS lines
         FROM journal_entries je
         LEFT JOIN journal_lines jl ON jl.journal_id = je.id AND jl.tenant_id = je.tenant_id
         LEFT JOIN chart_of_accounts coa ON jl.account_id = coa.id
         WHERE je.id = $1 AND je.tenant_id = $2
         GROUP BY je.id`,
        [req.params.id, tenantId]
      );
      if (!journal) return fail(res, 'Journal not found', 404);
      return ok(res, journal);
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create manual journal ─────────────────────────────────────────────────────
journalsRouter.post('/',
  requirePermission('journal_entries', 'create'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { entry_date, narration, lines } =
      req.body as { entry_date?: string; narration?: string; lines?: JournalLineInput[] };

    if (!entry_date || !narration || !Array.isArray(lines) || lines.length < 2) {
      return fail(res, 'entry_date, narration, and at least 2 lines are required');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // postManualJournal validates debit=credit internally; throws on imbalance
      const journalId = await postManualJournal(
        db, tenantId, entry_date, narration, lines, userId
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'journal_entries',
        recordId: journalId,
        newValues: { entry_date, narration, lines },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, { journalId }, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      // Bubble up journal imbalance as a 400
      if (err.message?.includes('Journal imbalance')) return fail(res, err.message);
      next(err);
    } finally { db.release(); }
  }
);
