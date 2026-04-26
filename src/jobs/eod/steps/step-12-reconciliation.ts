// Step 12: Run reconciliation — MT5 equity vs system equity
// Section 8: log result in daily_reconciliation
// Status: MATCHED (diff < threshold) / BREAK (diff significant)

import type { EODContext, StepResult } from '../../../types/eod';

const MATCH_THRESHOLD_USD = 0.01;  // differences < 1 cent are considered matched

export async function step12Reconciliation(
  ctx: EODContext,
  mt5TotalEquity: number  // provided by MT5 sync service at EOD
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];

  // System equity = sum of client_ledger balance_after for all active accounts
  const { rows: [sysRow] } = await ctx.db.query<{ total: string }>(
    `SELECT COALESCE(SUM(last_bal.balance_after), 0) AS total
     FROM (
       SELECT DISTINCT ON (mt5_account_id)
         mt5_account_id, balance_after
       FROM client_ledger
       WHERE tenant_id = $1
       ORDER BY mt5_account_id, created_at DESC, id DESC
     ) last_bal`,
    [ctx.tenantId]
  );

  const systemEquity = parseFloat(sysRow?.total ?? '0');
  const diff         = mt5TotalEquity - systemEquity;
  const status       = Math.abs(diff) <= MATCH_THRESHOLD_USD ? 'MATCHED' : 'BREAK';

  try {
    await ctx.db.query(
      `INSERT INTO daily_reconciliation
         (tenant_id, recon_date, mt5_total_equity, system_total_equity, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, recon_date)
       DO UPDATE SET
         mt5_total_equity    = EXCLUDED.mt5_total_equity,
         system_total_equity = EXCLUDED.system_total_equity,
         status              = EXCLUDED.status`,
      [ctx.tenantId, ctx.eodDate, mt5TotalEquity, systemEquity, status]
    );
  } catch (err) {
    errors.push(`Reconciliation insert failed: ${err}`);
  }

  if (status === 'BREAK') {
    errors.push(
      `RECON BREAK: MT5=${mt5TotalEquity.toFixed(2)} System=${systemEquity.toFixed(2)} Diff=${diff.toFixed(2)}`
    );
  }

  return {
    step: 12,
    name: 'Reconciliation',
    success: status === 'MATCHED',
    recordsProcessed: 1,
    errors,
    durationMs: Date.now() - start,
  };
}
