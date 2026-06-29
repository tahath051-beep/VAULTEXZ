import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC LIMIT 50`,
      [req.user!.sub, req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE user_id=$1 AND tenant_id=$2 AND is_read=false`,
      [req.user!.sub, req.user!.tenantId]
    );
    ok(res, { count: parseInt(rows[0].count) });
  } catch (e) { next(e); }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read=true, read_at=NOW()
       WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user!.sub]
    );
    ok(res, { success: true });
  } catch (e) { next(e); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read=true, read_at=NOW()
       WHERE user_id=$1 AND is_read=false`,
      [req.user!.sub]
    );
    ok(res, { success: true });
  } catch (e) { next(e); }
});

export default router;

