// Real-time deposit / withdrawal handler via MT5 WebSocket stream
// Fires on every BALANCE event; posts journal + client_ledger immediately
// Start once per tenant at application boot

import { pool }                   from '../../config/database';
import { subscribeBalanceStream }  from './mt5.bridge';
import type { MT5BalanceEvent }    from './mt5.types';
import {
  postDeposit,
  postWithdrawal,
  appendClientLedger,
} from '../journal.service';

export function startRealtimeSync(tenantId: string): () => void {
  const stop = subscribeBalanceStream(
    (event) => {
      handleBalanceEvent(tenantId, event).catch((err) => {
        console.error(
          `[MT5 Realtime] Balance event failed tenant=${tenantId} ticket=${event.ticket}:`, err
        );
      });
    },
    (err) => {
      console.error(`[MT5 Realtime] WebSocket error tenant=${tenantId}:`, err.message);
    }
  );

  console.log(`[MT5 Realtime] Listening for deposits/withdrawals — tenant=${tenantId}`);
  return stop;
}

async function handleBalanceEvent(
  tenantId: string,
  event: MT5BalanceEvent
): Promise<void> {
  const db = await pool.connect();

  try {
    const accRes = await db.query<{ id: string; currency: string }>(
      `SELECT id, currency FROM mt5_accounts
       WHERE tenant_id = $1 AND mt5_login = $2 AND is_active = true`,
      [tenantId, event.login]
    );

    if (!accRes.rowCount) {
      console.warn(
        `[MT5 Realtime] Unknown login ${event.login} for tenant=${tenantId} — skipping`
      );
      return;
    }

    const acct      = accRes.rows[0];
    const isDeposit = event.amount > 0;
    const absAmount = Math.abs(event.amount);
    const eventDate = new Date(event.time * 1000).toISOString().slice(0, 10);
    const payType   = isDeposit ? 'DEPOSIT' : 'WITHDRAWAL';
    const note      = event.comment || `MT5 ${payType.toLowerCase()} ticket#${event.ticket}`;

    await db.query('BEGIN');

    // Insert payment record (auto-approved — came from MT5)
    const pmtRes = await db.query<{ id: string }>(
      `INSERT INTO payments
         (tenant_id, mt5_account_id, payment_type, amount, currency,
          amount_usd, exchange_rate, source, status, narration)
       VALUES ($1,$2,$3,$4,$5,$6,1.0,'GATEWAY','APPROVED',$7)
       RETURNING id`,
      [tenantId, acct.id, payType, absAmount, acct.currency, absAmount, note]
    );
    const paymentId = pmtRes.rows[0].id;

    // Post journal
    const journalId = isDeposit
      ? await postDeposit(
          db, tenantId, eventDate, paymentId, absAmount,
          `Deposit: MT5 login ${event.login} ticket#${event.ticket}`
        )
      : await postWithdrawal(
          db, tenantId, eventDate, paymentId, absAmount,
          `Withdrawal: MT5 login ${event.login} ticket#${event.ticket}`
        );

    // Append client_ledger
    await appendClientLedger(
      db, tenantId, acct.id,
      payType,
      isDeposit ? absAmount : -absAmount,
      acct.currency,
      paymentId, 'PAYMENT',
      journalId, note
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    db.release();
  }
}
