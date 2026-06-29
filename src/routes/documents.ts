import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { entity_type, entity_id, status } = req.query;
    let q = `SELECT d.*, dc.name AS category_name, u.full_name AS uploaded_by_name
             FROM documents d
             LEFT JOIN document_categories dc ON dc.id = d.category_id
             LEFT JOIN users u ON u.id = d.uploaded_by
             WHERE d.tenant_id = $1`;
    const params: any[] = [req.user!.tenantId];
    if (entity_type) { params.push(entity_type); q += ` AND d.entity_type=$${params.length}`; }
    if (entity_id)   { params.push(entity_id);   q += ` AND d.entity_id=$${params.length}`; }
    if (status)      { params.push(status);       q += ` AND d.status=$${params.length}`; }
    q += ' ORDER BY d.created_at DESC';
    const { rows } = await pool.query(q, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { category_id, entity_type, entity_id, file_name, file_key, file_size, mime_type, expires_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO documents
         (tenant_id, category_id, entity_type, entity_id, file_name, file_key, file_size, mime_type, expires_at, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.tenantId, category_id, entity_type, entity_id, file_name, file_key, file_size, mime_type, expires_at, req.user!.sub]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

router.post('/:id/review', async (req, res, next) => {
  try {
    const { status, review_notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE documents SET status=$1, review_notes=$2, reviewed_by=$3, reviewed_at=NOW()
       WHERE id=$4 AND tenant_id=$5 RETURNING *`,
      [status, review_notes, req.user!.sub, req.params.id, req.user!.tenantId]
    );
    if (!rows[0]) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM document_categories WHERE tenant_id=$1 ORDER BY entity_type, name`,
      [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, entity_type, is_required } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO document_categories (tenant_id, name, entity_type, is_required)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user!.tenantId, name, entity_type, is_required ?? false]
    );
    created(res, rows[0]);
  } catch (e) { next(e); }
});

export default router;

