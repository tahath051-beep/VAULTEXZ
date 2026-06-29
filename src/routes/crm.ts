import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Leads ---
router.get('/leads', async (req, res, next) => {
  try {
    const { status, assigned_to } = req.query;
    let q = `SELECT l.*, u.full_name AS assigned_to_name, i.full_name AS ib_name
             FROM leads l
             LEFT JOIN users u ON u.id = l.assigned_to
             LEFT JOIN ibs i ON i.id = l.ib_id
             WHERE l.tenant_id = $1`;
    const params: any[] = [req.user!.tenantId];
    if (status)      { params.push(status);      q += ` AND l.status=$${params.length}`; }
    if (assigned_to) { params.push(assigned_to); q += ` AND l.assigned_to=$${params.length}`; }
    q += ' ORDER BY l.created_at DESC LIMIT 200';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/leads', async (req, res, next) => {
  try {
    const { full_name, email, phone, country, source, ib_id, assigned_to, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO leads (tenant_id, full_name, email, phone, country, source, ib_id, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, full_name, email, phone, country, source, ib_id, assigned_to, notes, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.patch('/leads/:id', async (req, res, next) => {
  try {
    const { status, assigned_to, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE leads SET status=COALESCE($1,status), assigned_to=COALESCE($2,assigned_to), notes=COALESCE($3,notes)
       WHERE id=$4 AND tenant_id=$5 RETURNING *`,
      [status, assigned_to, notes, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

router.post('/leads/:id/convert', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { client_code, kyc_status } = req.body;
    const { rows: [lead] } = await client.query(
      `SELECT * FROM leads WHERE id=$1 AND tenant_id=$2`, [req.params.id, req.user!.tenantId]
    );
    if (!lead) { await client.query('ROLLBACK'); return notFound(res); }
    const { rows: [newClient] } = await client.query(
      `INSERT INTO clients (tenant_id, client_code, full_name, email, country, ib_id, kyc_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user!.tenantId, client_code, lead.full_name, lead.email, lead.country, lead.ib_id, kyc_status || 'PENDING']
    );
    await client.query(
      `UPDATE leads SET status='CONVERTED', client_id=$1, converted_at=NOW() WHERE id=$2`,
      [newClient.id, lead.id]
    );
    await client.query('COMMIT');
    ok(res, newClient);
  } catch (e) { await client.query('ROLLBACK'); next(e); }
  finally { client.release(); }
});

// --- Activities ---
router.get('/activities', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.query;
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name AS created_by_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.tenant_id=$1
       ${entity_type ? 'AND a.entity_type=$2' : ''}
       ${entity_id   ? `AND a.entity_id=$${entity_type ? 3 : 2}` : ''}
       ORDER BY a.created_at DESC LIMIT 100`,
      [req.user!.tenantId, ...(entity_type ? [entity_type] : []), ...(entity_id ? [entity_id] : [])]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/activities', async (req, res, next) => {
  try {
    const { entity_type, entity_id, activity_type, subject, notes, outcome, scheduled_at, completed_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO activities
         (tenant_id, entity_type, entity_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, entity_type, entity_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Tickets ---
router.get('/tickets', async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    let q = `SELECT t.*, u.full_name AS assigned_to_name
             FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to
             WHERE t.tenant_id=$1`;
    const params: any[] = [req.user!.tenantId];
    if (status)   { params.push(status);   q += ` AND t.status=$${params.length}`; }
    if (priority) { params.push(priority); q += ` AND t.priority=$${params.length}`; }
    q += ' ORDER BY t.created_at DESC LIMIT 100';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/tickets', async (req, res, next) => {
  try {
    const { entity_type, entity_id, category, subject, description, priority } = req.body;
    const { rows: [seq] } = await pool.query(
      `SELECT COUNT(*)+1 AS n FROM tickets WHERE tenant_id=$1`, [req.user!.tenantId]
    );
    const ticketNumber = `TKT-${String(seq.n).padStart(5,'0')}`;
    const { rows } = await pool.query(
      `INSERT INTO tickets
         (tenant_id, ticket_number, entity_type, entity_id, category, subject, description, priority, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.tenantId, ticketNumber, entity_type, entity_id, category, subject, description, priority || 'MEDIUM', req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/tickets/:id/messages', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT tm.*, u.full_name AS sender_name
       FROM ticket_messages tm LEFT JOIN users u ON u.id = tm.sender_id
       WHERE tm.ticket_id=$1 ORDER BY tm.created_at`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/tickets/:id/messages', async (req, res, next) => {
  try {
    const { body, is_internal } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO ticket_messages (tenant_id, ticket_id, body, sender_type, sender_id, is_internal)
       VALUES ($1,$2,$3,'AGENT',$4,$5) RETURNING *`,
      [req.user!.tenantId, req.params.id, body, req.user!.sub, is_internal ?? false]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.patch('/tickets/:id', async (req, res, next) => {
  try {
    const { status, assigned_to, priority } = req.body;
    const { rows } = await pool.query(
      `UPDATE tickets SET
         status=COALESCE($1,status),
         assigned_to=COALESCE($2,assigned_to),
         priority=COALESCE($3,priority),
         resolved_at=CASE WHEN $1='RESOLVED' THEN NOW() ELSE resolved_at END,
         closed_at=CASE WHEN $1='CLOSED' THEN NOW() ELSE closed_at END
       WHERE id=$4 AND tenant_id=$5 RETURNING *`,
      [status, assigned_to, priority, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

