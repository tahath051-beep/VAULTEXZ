// Step 01: Pull all closed trades from MT5 since last sync
// Section 8: read last_mt5_ticket → pull deals where ticket > last ticket
// Returns unposted trades for eodDate from the trades table.
// (MT5 API wire-up happens in MT5 Sync Service; EOD operates on already-imported rows.)

import type { EODContext, StepResult, TradeRow } from '../../../types/eod';

export async function step01PullTrades(
  ctx: EODContext
): Promise<StepResult & { trades: TradeRow[] }> {
  const start = Date.now();
  const errors: string[] = [];

  // Ensure no duplicate EOD run for this date (idempotency guard)
  const { rows: lockCheck } = await ctx.db.query<{ status: string }>(
    `SELECT status FROM eod_processing_log
     WHERE tenant_id = $1 AND eod_date = $2`,
    [ctx.tenantId, ctx.eodDate]
  );

  if (lockCheck[0]?.status === 'LOCKED') {
    throw new Error(`EOD for ${ctx.eodDate} is already locked — no reprocessing allowed`);
  }

  // Pull unposted trades closed on eodDate
  const { rows: trades } = await ctx.db.query<TradeRow>(
    `SELECT t.*
     FROM trades t
     JOIN mt5_accounts a ON a.id = t.mt5_account_id
     WHERE t.tenant_id = $1
       AND t.journal_posted = false
       AND t.close_time::date = $2
       AND a.is_active = true
     ORDER BY t.close_time ASC, t.mt5_ticket ASC`,
    [ctx.tenantId, ctx.eodDate]
  );

  // Log the sync job entry
  await ctx.db.query(
    `INSERT INTO sync_jobs
       (tenant_id, job_type, status, started_at, records_synced)
     VALUES ($1, 'TRADES', 'RUNNING', NOW(), $2)
     ON CONFLICT DO NOTHING`,
    [ctx.tenantId, trades.length]
  );

  return {
    step: 1,
    name: 'Pull Trades',
    success: true,
    recordsProcessed: trades.length,
    errors,
    durationMs: Date.now() - start,
    trades,
  };
}
