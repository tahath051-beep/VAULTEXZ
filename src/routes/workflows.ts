import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

// --- Templates ---
router.get('/templates', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT wt.*, COUNT(ws.id) AS stage_count
       FROM workflow_templates wt
       LEFT JOIN workflow_stages ws ON ws.template_id = wt.id
       WHERE wt.tenant_id = $1
       GROUP BY wt.id ORDER BY wt.process_type`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/templates', async (req, res, next) => {
  try {
    const { name, process_type, description, sla_hours } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO workflow_templates (tenant_id, name, process_type, description, sla_hours, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.tenantId, name, process_type, description, sla_hours || 24, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/templates/:id/stages', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ws.*, r.name AS role_name
       FROM workflow_stages ws
       LEFT JOIN roles r ON r.id = ws.assigned_role_id
       WHERE ws.template_id = $1
       ORDER BY ws.stage_order`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/templates/:id/stages', async (req, res, next) => {
  try {
    const { stage_order, name, stage_type, assigned_role_id, sla_hours, auto_action } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO workflow_stages
         (template_id, tenant_id, stage_order, name, stage_type, assigned_role_id, sla_hours, auto_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, req.user!.tenantId, stage_order, name, stage_type, assigned_role_id, sla_hours, auto_action]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

// --- Instances ---
router.get('/instances', async (req, res, next) => {
  try {
    const { status, process_type } = req.query;
    let q = `SELECT wi.*, wt.name AS template_name,
               u.full_name AS initiated_by_name
             FROM workflow_instances wi
             JOIN workflow_templates wt ON wt.id = wi.template_id
             LEFT JOIN users u ON u.id = wi.initiated_by
             WHERE wi.tenant_id = $1`;
    const params: any[] = [req.user!.tenantId];
    if (status) { params.push(status); q += ` AND wi.status = $${params.length}`; }
    if (process_type) { params.push(process_type); q += ` AND wi.process_type = $${params.length}`; }
    q += ' ORDER BY wi.created_at DESC LIMIT 100';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.get('/instances/:id', async (req, res, next) => {
  try {
    const { rows: [instance] } = await pool.query(
      `SELECT * FROM workflow_instances WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user!.tenantId]
    );
    if (!instance) return notFound(res);
    const { rows: tasks } = await pool.query(
      `SELECT wt.*, u.full_name AS assigned_to_name, a.full_name AS action_by_name
       FROM workflow_tasks wt
       LEFT JOIN users u ON u.id = wt.assigned_to
       LEFT JOIN users a ON a.id = wt.action_by
       WHERE wt.instance_id = $1 ORDER BY wt.stage_order`,
      [req.params.id]
    );
    ok(res, { instance, tasks });
  } catch (e) { next(e); }
});

// --- My Tasks ---
router.get('/my-tasks', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT wt.*, wi.process_type, wi.reference_id, wi.reference_type,
               tmpl.name AS template_name
       FROM workflow_tasks wt
       JOIN workflow_instances wi ON wi.id = wt.instance_id
       JOIN workflow_templates tmpl ON tmpl.id = wi.template_id
       WHERE wt.assigned_to = $1 AND wt.status = 'PENDING'
       ORDER BY wt.due_at ASC NULLS LAST`,
      [req.user!.sub]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

// --- Act on task ---
router.post('/tasks/:id/action', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { action, comment } = req.body;
    // action: APPROVED | REJECTED
    const { rows: [task] } = await client.query(
      `UPDATE workflow_tasks
       SET status=$1, action_taken=$1, action_comment=$2, action_by=$3, action_at=NOW()
       WHERE id=$4 AND assigned_to=$5 AND status='PENDING'
       RETURNING *`,
      [action, comment, req.user!.sub, req.params.id, req.user!.sub]
    );
    if (!task) { await client.query('ROLLBACK'); return notFound(res); }

    // Advance or close instance
    const { rows: [instance] } = await client.query(
      `SELECT * FROM workflow_instances WHERE id = $1`, [task.instance_id]
    );
    const { rows: stages } = await client.query(
      `SELECT * FROM workflow_stages WHERE template_id = $1 ORDER BY stage_order`,
      [instance.template_id]
    );
    const currentStage = stages.find((s: any) => s.stage_order === instance.current_stage);
    const nextOrder = action === 'APPROVED' ? currentStage?.on_approve_next : currentStage?.on_reject_next;
    const nextStage = stages.find((s: any) => s.stage_order === nextOrder);

    if (!nextStage) {
      const finalStatus = action === 'APPROVED' ? 'COMPLETED' : 'REJECTED';
      await client.query(
        `UPDATE workflow_instances SET status=$1, completed_at=NOW() WHERE id=$2`,
        [finalStatus, instance.id]
      );
    } else {
      await client.query(
        `UPDATE workflow_instances SET current_stage=$1 WHERE id=$2`,
        [nextStage.stage_order, instance.id]
      );
      await client.query(
        `INSERT INTO workflow_tasks
           (tenant_id, instance_id, stage_id, stage_order, assigned_role, status, due_at)
         VALUES ($1,$2,$3,$4,$5,'PENDING', NOW() + ($6 || ' hours')::INTERVAL)`,
        [req.user!.tenantId, instance.id, nextStage.id, nextStage.stage_order,
         nextStage.assigned_role_id, nextStage.sla_hours || 24]
      );
    }
    await client.query('COMMIT');
    ok(res, { task, advanced_to: nextStage?.stage_order ?? null });
  } catch (e) { await client.query('ROLLBACK'); next(e); }
  finally { client.release(); }
});

export default router;

