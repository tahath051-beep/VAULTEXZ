import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { client_id } = req.query;
    const { rows } = await pool.query(
      `SELECT w.*, c.full_name AS client_name
       FROM wallets w
       JOIN clients c ON c.id = w.client_id
       WHERE w.tenant_id = $1
       ${client_id ? 'AND w.client_id = $2' : ''}
       ORDER BY c.full_name`,
      client_id ? [req.user!.tenantId, client_id] : [req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.get('/:id/transactions', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM wallet_transactions
       WHERE wallet_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC LIMIT 100`,
      [req.params.id, req.user!.tenantId]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

router.post('/:id/adjust', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { type, amount, currency, narration } = req.body;
    const { rows: [wallet] } = await client.query(
      `SELECT * FROM wallets WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [req.params.id, req.user!.tenantId]
    );
    if (!wallet) { await client.query('ROLLBACK'); return notFound(res); }
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    await client.query(
      `UPDATE wallets SET balance = $1 WHERE id = $2`,
      [newBalance, wallet.id]
    );
    const { rows: [txn] } = await client.query(
      `INSERT INTO wallet_transactions
         (tenant_id, wallet_id, type, amount, currency, balance_after, narration, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.tenantId, wallet.id, type, amount, currency || wallet.currency, newBalance, narration, req.user!.sub]
    );
    await client.query('COMMIT');
    ok(res, { wallet: { ...wallet, balance: newBalance }, transaction: txn });
  } catch (e) { await client.query('ROLLBACK'); next(e); }
  finally { client.release(); }
});

export default router;

