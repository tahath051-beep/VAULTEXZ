import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Snapshots ---
router.get('/snapshots', async (req, res, next) => {
  try {
    const { symbol, limit = 100 } = req.query;
    let q = `SELECT * FROM risk_snapshots WHERE tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (symbol) { params.push(symbol); q += ` AND symbol=$${params.length}`; }
    q += ` ORDER BY snapshot_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.get('/snapshots/latest', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (symbol) *
       FROM risk_snapshots WHERE tenant_id=$1
       ORDER BY symbol, snapshot_time DESC`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

// --- Coverage ---
router.get('/coverage', async (req, res, next) => {
  try {
    const { status, symbol } = req.query;
    let q = `SELECT * FROM coverage_records WHERE tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (status) { params.push(status); q += ` AND status=$${params.length}`; }
    if (symbol) { params.push(symbol); q += ` AND symbol=$${params.length}`; }
    q += ' ORDER BY open_time DESC LIMIT 200';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/coverage', async (req, res, next) => {
  try {
    const { symbol, coverage_type, direction, lots, open_price, lp_name, lp_ticket, open_time } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO coverage_records
         (tenant_id, symbol, coverage_type, direction, lots, open_price, lp_name, lp_ticket, open_time, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, symbol, coverage_type, direction, lots, open_price, lp_name, lp_ticket, open_time, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Limits ---
router.get('/limits', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM risk_limits WHERE tenant_id=$1 AND is_active=true ORDER BY symbol, limit_type`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/limits', async (req, res, next) => {
  try {
    const { symbol, limit_type, limit_value, alert_pct } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO risk_limits (tenant_id, symbol, limit_type, limit_value, alert_pct)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.tenantId, symbol, limit_type, limit_value, alert_pct ?? 80]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Alerts ---
router.get('/alerts', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ra.*, rl.limit_type, u.full_name AS acknowledged_by_name
       FROM risk_alerts ra
       LEFT JOIN risk_limits rl ON rl.id = ra.limit_id
       LEFT JOIN users u ON u.id = ra.acknowledged_by
       WHERE ra.tenant_id=$1
       ORDER BY ra.created_at DESC LIMIT 50`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/alerts/:id/acknowledge', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE risk_alerts SET is_acknowledged=true, acknowledged_by=$1, acknowledged_at=NOW()
       WHERE id=$2 AND tenant_id=$3`,
      [req.user!.sub, req.params.id, req.user!.tenantId]
    );
    ok(res, { success: true });
  } catch (e) { next(e); }
});

export default router;

