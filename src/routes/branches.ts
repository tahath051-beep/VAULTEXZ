import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, COUNT(d.id) AS department_count
       FROM branches b
       LEFT JOIN departments d ON d.branch_id = b.id
       WHERE b.tenant_id = $1
       GROUP BY b.id
       ORDER BY b.name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, country, city, address } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO branches (tenant_id, name, country, city, address)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.tenantId, name, country, city, address]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/:id/departments', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM departments WHERE branch_id = $1 AND tenant_id = $2 ORDER BY name`,
      [req.params.id, req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/:id/departments', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO departments (tenant_id, branch_id, name, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user!.tenantId, req.params.id, name, description]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, country, city, address, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE branches SET name=$1, country=$2, city=$3, address=$4, is_active=$5
       WHERE id=$6 AND tenant_id=$7 RETURNING *`,
      [name, country, city, address, is_active, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

