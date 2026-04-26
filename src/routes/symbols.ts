// Module 10: Symbol Configuration
// GET  /symbols           list active symbol configs
// GET  /symbols/:id       detail
// POST /symbols           create new symbol config
// PATCH /symbols/:id      deactivate or update spreads/pip values

import { Router } from 'express';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';

export const symbolsRouter = Router();
symbolsRouter.use(authenticate);

// ── List ──────────────────────────────────────────────────────────────────────
symbolsRouter.get('/',
  requirePermission('system_config', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const { asset_class, is_active } = req.query as Record<string, string>;

    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT *
         FROM symbol_config
         WHERE tenant_id = $1
           AND ($2::text IS NULL OR asset_class = $2)
           AND ($3::bool IS NULL OR is_active   = $3::bool)
         ORDER BY symbol, effective_from DESC`,
        [
          tenantId,
          asset_class ?? null,
          is_active != null ? is_active === 'true' : null,
        ]
      );
      return ok(res, { symbols: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Detail ────────────────────────────────────────────────────────────────────
symbolsRouter.get('/:id',
  requirePermission('system_config', 'view'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows: [symbol] } = await db.query(
        `SELECT * FROM symbol_config WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!symbol) return fail(res, 'Symbol not found', 404);
      return ok(res, symbol);
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create ────────────────────────────────────────────────────────────────────
symbolsRouter.post('/',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const {
      symbol, pip_value_usd, broker_spread, lp_spread,
      contract_size, asset_class, effective_from, effective_to,
    } = req.body as Record<string, string>;

    if (!symbol || !pip_value_usd || !broker_spread || !lp_spread || !contract_size) {
      return fail(res, 'symbol, pip_value_usd, broker_spread, lp_spread, contract_size are required');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [sym] } = await db.query(
        `INSERT INTO symbol_config
           (tenant_id, symbol, pip_value_usd, broker_spread, lp_spread,
            contract_size, asset_class, effective_from, effective_to)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          tenantId, symbol.toUpperCase(),
          Number(pip_value_usd), Number(broker_spread), Number(lp_spread),
          Number(contract_size),
          asset_class   ?? null,
          effective_from ?? new Date().toISOString().slice(0, 10),
          effective_to   ?? null,
        ]
      );

      await writeAuditLog(db, {
        tenantId, userId, action: 'CREATE', module: 'system_config',
        recordId: sym.id, newValues: sym, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, sym, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'Symbol config already exists for this date range', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Update ────────────────────────────────────────────────────────────────────
symbolsRouter.patch('/:id',
  requirePermission('system_config', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: userId } = req.user;
    const { pip_value_usd, broker_spread, lp_spread, is_active, effective_to } =
      req.body as Record<string, string>;

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [before] } = await db.query(
        `SELECT * FROM symbol_config WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!before) return fail(res, 'Symbol not found', 404);

      const { rows: [updated] } = await db.query(
        `UPDATE symbol_config
         SET pip_value_usd  = COALESCE($3::numeric, pip_value_usd),
             broker_spread  = COALESCE($4::numeric, broker_spread),
             lp_spread      = COALESCE($5::numeric, lp_spread),
             is_active      = COALESCE($6::bool,    is_active),
             effective_to   = COALESCE($7::date,    effective_to)
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, tenantId,
         pip_value_usd ?? null, broker_spread ?? null, lp_spread ?? null,
         is_active     ?? null, effective_to  ?? null]
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
