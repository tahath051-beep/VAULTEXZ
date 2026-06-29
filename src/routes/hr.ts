import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Employees ---
router.get('/employees', async (req, res, next) => {
  try {
    const { status, department_id, branch_id } = req.query;
    let q = `SELECT e.*, b.name AS branch_name, d.name AS department_name
             FROM employees e
             LEFT JOIN branches b ON b.id = e.branch_id
             LEFT JOIN departments d ON d.id = e.department_id
             WHERE e.tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (status)        { params.push(status);        q += ` AND e.status=$${params.length}`; }
    if (department_id) { params.push(department_id); q += ` AND e.department_id=$${params.length}`; }
    if (branch_id)     { params.push(branch_id);     q += ` AND e.branch_id=$${params.length}`; }
    q += ' ORDER BY e.full_name';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/employees', async (req, res, next) => {
  try {
    const f = req.body;
    const { rows } = await pool.query(
      `INSERT INTO employees
         (tenant_id, user_id, employee_code, full_name, email, phone,
          national_id, nationality, date_of_birth, gender,
          branch_id, department_id, job_title, employment_type,
          hire_date, manager_id, base_salary, salary_currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [req.user!.tenantId, f.user_id, f.employee_code, f.full_name, f.email, f.phone,
       f.national_id, f.nationality, f.date_of_birth, f.gender,
       f.branch_id, f.department_id, f.job_title, f.employment_type || 'FULL_TIME',
       f.hire_date, f.manager_id, f.base_salary, f.salary_currency || 'USD']
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/employees/:id', async (req, res, next) => {
  try {
    const { rows: [emp] } = await pool.query(
      `SELECT e.*, b.name AS branch_name, d.name AS department_name
       FROM employees e
       LEFT JOIN branches b ON b.id = e.branch_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.id=$1 AND e.tenant_id=$2`,
      [req.params.id, req.user!.tenantId]
    );
    if (!emp) return notFound(res);
    ok(res, emp);
  } catch (e) { next(e); }
});

// --- Leave ---
router.get('/leave-types', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM leave_types WHERE tenant_id=$1 ORDER BY name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/leave-types', async (req, res, next) => {
  try {
    const { name, days_per_year, is_paid } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO leave_types (tenant_id, name, days_per_year, is_paid)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user!.tenantId, name, days_per_year, is_paid ?? true]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/leave-requests', async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let q = `SELECT lr.*, e.full_name AS employee_name, lt.name AS leave_type_name
             FROM leave_requests lr
             JOIN employees e ON e.id = lr.employee_id
             JOIN leave_types lt ON lt.id = lr.leave_type_id
             WHERE lr.tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (employee_id) { params.push(employee_id); q += ` AND lr.employee_id=$${params.length}`; }
    if (status)      { params.push(status);      q += ` AND lr.status=$${params.length}`; }
    q += ' ORDER BY lr.created_at DESC';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/leave-requests', async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, days, reason } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, days, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user!.tenantId, employee_id, leave_type_id, start_date, end_date, days, reason]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.post('/leave-requests/:id/approve', async (req, res, next) => {
  try {
    const { action, rejection_note } = req.body;
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const { rows } = await pool.query(
      `UPDATE leave_requests SET status=$1, approved_by=$2, approved_at=NOW(), rejection_note=$3
       WHERE id=$4 AND tenant_id=$5 RETURNING *`,
      [status, req.user!.sub, rejection_note, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Payroll ---
router.get('/payroll-runs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pr.*, u.full_name AS created_by_name
       FROM payroll_runs pr LEFT JOIN users u ON u.id = pr.created_by
       WHERE pr.tenant_id=$1 ORDER BY pr.period_year DESC, pr.period_month DESC`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/payroll-runs', async (req, res, next) => {
  try {
    const { period_year, period_month, currency } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payroll_runs (tenant_id, period_year, period_month, currency, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.tenantId, period_year, period_month, currency || 'USD', req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/payroll-runs/:id/items', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pi.*, e.full_name AS employee_name, e.job_title
       FROM payroll_items pi JOIN employees e ON e.id = pi.employee_id
       WHERE pi.payroll_run_id=$1`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/payroll-runs/:id/items', async (req, res, next) => {
  try {
    const { employee_id, base_salary, allowances, bonuses, deductions, tax, net_pay, currency } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payroll_items
         (tenant_id, payroll_run_id, employee_id, base_salary, allowances, bonuses, deductions, tax, net_pay, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, req.params.id, employee_id, base_salary, allowances ?? 0, bonuses ?? 0, deductions ?? 0, tax ?? 0, net_pay, currency || 'USD']
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

