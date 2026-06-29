import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Shareholders ---
router.get('/shareholders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM shareholders WHERE tenant_id=$1 AND is_active=true ORDER BY ownership_pct DESC`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/shareholders', async (req, res, next) => {
  try {
    const { full_name, entity_type, email, nationality, ownership_pct, share_class, user_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO shareholders
         (tenant_id, full_name, entity_type, email, nationality, ownership_pct, share_class, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.tenantId, full_name, entity_type || 'INDIVIDUAL', email, nationality,
       ownership_pct, share_class || 'ORDINARY', user_id]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Capital Contributions ---
router.get('/contributions', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT cc.*, s.full_name AS shareholder_name
       FROM capital_contributions cc
       JOIN shareholders s ON s.id = cc.shareholder_id
       WHERE cc.tenant_id=$1 ORDER BY cc.contribution_date DESC`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/contributions', async (req, res, next) => {
  try {
    const { shareholder_id, contribution_date, amount, currency, amount_base,
            exchange_rate, contribution_type, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO capital_contributions
         (tenant_id, shareholder_id, contribution_date, amount, currency,
          amount_base, exchange_rate, contribution_type, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, shareholder_id, contribution_date, amount, currency,
       amount_base, exchange_rate ?? 1, contribution_type || 'INITIAL', description, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Profit Distributions ---
router.get('/distributions', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pd.*, u.full_name AS approved_by_name
       FROM profit_distributions pd
       LEFT JOIN users u ON u.id = pd.approved_by
       WHERE pd.tenant_id=$1 ORDER BY pd.period_year DESC, pd.period_month DESC NULLS LAST`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/distributions', async (req, res, next) => {
  try {
    const { period_year, period_month, total_profit, distributable, retained } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO profit_distributions
         (tenant_id, period_year, period_month, total_profit, distributable, retained, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user!.tenantId, period_year, period_month, total_profit, distributable, retained ?? 0, req.user!.sub]
    );
    // Auto-generate distribution lines per shareholder
    const { rows: shareholders } = await pool.query(
      `SELECT * FROM shareholders WHERE tenant_id=$1 AND is_active=true`,
      [req.user!.tenantId]
    );
    for (const sh of shareholders) {
      const amount = parseFloat(distributable) * (parseFloat(sh.ownership_pct) / 100);
      await pool.query(
        `INSERT INTO profit_distribution_lines
           (tenant_id, distribution_id, shareholder_id, ownership_pct, amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.user!.tenantId, rows[0].id, sh.id, sh.ownership_pct, amount]
      );
    }
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/distributions/:id/lines', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pdl.*, s.full_name AS shareholder_name
       FROM profit_distribution_lines pdl
       JOIN shareholders s ON s.id = pdl.shareholder_id
       WHERE pdl.distribution_id=$1`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/distributions/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE profit_distributions SET status='APPROVED', approved_by=$1, approved_at=NOW()
       WHERE id=$2 AND tenant_id=$3 AND status='DRAFT' RETURNING *`,
      [req.user!.sub, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

