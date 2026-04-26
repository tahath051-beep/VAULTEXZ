// Module 4: Reports
// GET /reports/pnl?date=YYYY-MM-DD
// GET /reports/balance-sheet?date=YYYY-MM-DD
// GET /reports/client-ledger?mt5AccountId=...&startDate=...&endDate=...
// GET /reports/reconciliation?date=YYYY-MM-DD

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';

export const reportsRouter = Router();
reportsRouter.use(authenticate);

// ── P&L Statement ─────────────────────────────────────────────────────────────
reportsRouter.get('/pnl',
  requirePermission('pnl_statement', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT coa.code, coa.name, coa.type, coa.normal_balance,
           SUM(
             CASE coa.normal_balance
               WHEN 'CREDIT' THEN jl.credit - jl.debit
               ELSE               jl.debit  - jl.credit
             END
           ) AS balance
         FROM journal_lines jl
         JOIN journal_entries    je  ON jl.journal_id  = je.id
         JOIN chart_of_accounts  coa ON jl.account_id  = coa.id
         WHERE je.tenant_id = $1
           AND je.entry_date <= $2
           AND coa.type IN ('REVENUE', 'EXPENSE')
         GROUP BY coa.id, coa.code, coa.name, coa.type, coa.normal_balance
         HAVING SUM(
           CASE coa.normal_balance
             WHEN 'CREDIT' THEN jl.credit - jl.debit
             ELSE               jl.debit  - jl.credit
           END
         ) <> 0
         ORDER BY coa.code`,
        [tenantId, date]
      );

      const revenue  = rows.filter(r => r.type === 'REVENUE');
      const expenses = rows.filter(r => r.type === 'EXPENSE');
      const totalRevenue  = revenue .reduce((s, r) => s + parseFloat(r.balance), 0);
      const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.balance), 0);
      const netPnL        = totalRevenue - totalExpenses;

      return ok(res, { date, revenue, expenses, totalRevenue, totalExpenses, netPnL });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Balance Sheet ─────────────────────────────────────────────────────────────
reportsRouter.get('/balance-sheet',
  requirePermission('balance_sheet', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT coa.code, coa.name, coa.type, coa.normal_balance,
           SUM(
             CASE coa.normal_balance
               WHEN 'DEBIT'  THEN jl.debit  - jl.credit
               ELSE               jl.credit - jl.debit
             END
           ) AS balance
         FROM journal_lines jl
         JOIN journal_entries   je  ON jl.journal_id = je.id
         JOIN chart_of_accounts coa ON jl.account_id = coa.id
         WHERE je.tenant_id = $1
           AND je.entry_date <= $2
           AND coa.type IN ('ASSET', 'LIABILITY', 'EQUITY')
         GROUP BY coa.id, coa.code, coa.name, coa.type, coa.normal_balance
         HAVING SUM(
           CASE coa.normal_balance
             WHEN 'DEBIT'  THEN jl.debit  - jl.credit
             ELSE               jl.credit - jl.debit
           END
         ) <> 0
         ORDER BY coa.code`,
        [tenantId, date]
      );

      const assets      = rows.filter(r => r.type === 'ASSET');
      const liabilities = rows.filter(r => r.type === 'LIABILITY');
      const equity      = rows.filter(r => r.type === 'EQUITY');
      const totalAssets      = assets     .reduce((s, r) => s + parseFloat(r.balance), 0);
      const totalLiabilities = liabilities.reduce((s, r) => s + parseFloat(r.balance), 0);
      const totalEquity      = equity     .reduce((s, r) => s + parseFloat(r.balance), 0);

      return ok(res, {
        date, assets, liabilities, equity,
        totalAssets, totalLiabilities, totalEquity,
      });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Client Ledger ─────────────────────────────────────────────────────────────
reportsRouter.get('/client-ledger',
  requirePermission('client_ledger', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { mt5AccountId, startDate, endDate } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 100, 500);
    const offset = Number(req.query.offset) || 0;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT cl.*,
           ma.mt5_login,
           c.full_name AS client_name,
           c.client_code
         FROM client_ledger cl
         JOIN mt5_accounts  ma ON cl.mt5_account_id = ma.id
         LEFT JOIN clients  c  ON ma.client_id      = c.id
         WHERE cl.tenant_id = $1
           AND ($2::uuid IS NULL OR cl.mt5_account_id = $2::uuid)
           AND ($3::date IS NULL OR cl.created_at::date >= $3::date)
           AND ($4::date IS NULL OR cl.created_at::date <= $4::date)
         ORDER BY cl.created_at DESC, cl.id DESC
         LIMIT $5 OFFSET $6`,
        [tenantId, mt5AccountId ?? null, startDate ?? null, endDate ?? null, limit, offset]
      );
      return ok(res, { entries: rows, limit, offset });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── LP Reconciliation ─────────────────────────────────────────────────────────
reportsRouter.get('/reconciliation',
  requirePermission('lp_reconciliation', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT dr.*, u.full_name AS resolved_by_name
         FROM daily_reconciliation dr
         LEFT JOIN users u ON dr.resolved_by = u.id
         WHERE dr.tenant_id = $1
           AND ($2::date IS NULL OR dr.recon_date = $2::date)
         ORDER BY dr.recon_date DESC
         LIMIT 30`,
        [tenantId, date || null]
      );
      return ok(res, { reconciliations: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);
