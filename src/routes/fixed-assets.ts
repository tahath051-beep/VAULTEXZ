import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/categories', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM asset_categories WHERE tenant_id=$1 ORDER BY name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, depreciation_method, useful_life_years, salvage_percent,
            gl_asset_account, gl_depreciation_account, gl_accum_depr_account } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO asset_categories
         (tenant_id, name, depreciation_method, useful_life_years, salvage_percent,
          gl_asset_account, gl_depreciation_account, gl_accum_depr_account)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.tenantId, name, depreciation_method || 'STRAIGHT_LINE', useful_life_years,
       salvage_percent ?? 0, gl_asset_account, gl_depreciation_account, gl_accum_depr_account]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let q = `SELECT fa.*, ac.name AS category_name, b.name AS branch_name
             FROM fixed_assets fa
             LEFT JOIN asset_categories ac ON ac.id = fa.category_id
             LEFT JOIN branches b ON b.id = fa.branch_id
             WHERE fa.tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (status) { params.push(status); q += ` AND fa.status=$${params.length}`; }
    q += ' ORDER BY fa.asset_code';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const f = req.body;
    const current_book_value = parseFloat(f.purchase_cost) - parseFloat(f.salvage_value ?? 0);
    const { rows } = await pool.query(
      `INSERT INTO fixed_assets
         (tenant_id, asset_code, name, category_id, branch_id, department_id,
          purchase_date, purchase_cost, currency, salvage_value, useful_life_years,
          depreciation_method, current_book_value, location, serial_number, supplier, warranty_expires, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [req.user!.tenantId, f.asset_code, f.name, f.category_id, f.branch_id, f.department_id,
       f.purchase_date, f.purchase_cost, f.currency || 'USD', f.salvage_value ?? 0,
       f.useful_life_years, f.depreciation_method || 'STRAIGHT_LINE', current_book_value,
       f.location, f.serial_number, f.supplier, f.warranty_expires, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/:id/depreciation', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM asset_depreciation_schedule WHERE asset_id=$1
       ORDER BY period_year, period_month`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.get('/:id/maintenance', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM asset_maintenance WHERE asset_id=$1 AND tenant_id=$2
       ORDER BY scheduled_date DESC`,
      [req.params.id, req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/:id/maintenance', async (req, res, next) => {
  try {
    const { maintenance_type, description, cost, currency, vendor, scheduled_date } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO asset_maintenance
         (tenant_id, asset_id, maintenance_type, description, cost, currency, vendor, scheduled_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.tenantId, req.params.id, maintenance_type, description, cost ?? 0, currency || 'USD', vendor, scheduled_date, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.post('/:id/dispose', async (req, res, next) => {
  try {
    const { disposal_proceeds, disposed_at } = req.body;
    const { rows } = await pool.query(
      `UPDATE fixed_assets SET status='DISPOSED', disposed_at=$1, disposal_proceeds=$2
       WHERE id=$3 AND tenant_id=$4 RETURNING *`,
      [disposed_at, disposal_proceeds ?? 0, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

