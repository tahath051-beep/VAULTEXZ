// Step 11: Take EOD snapshot — closing balance per CoA account
// Calculates: opening balance + sum(debit) - sum(credit) per account for all dates up to eodDate

import type { EODContext, StepResult } from '../../../types/eod';

export async function step11EODSnapshot(ctx: EODContext): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   saved  = 0;

  try {
    // Compute closing balance for every account that has journal activity
    // Uses cumulative sum of all journal lines up to and including eodDate
    const { rows: balances } = await ctx.db.query<{
      account_id: string;
      currency:   string;
      balance:    string;
    }>(
      `SELECT
         jl.account_id,
         jl.currency,
         SUM(
           CASE coa.normal_balance
             WHEN 'DEBIT'  THEN jl.debit  - jl.credit
             WHEN 'CREDIT' THEN jl.credit - jl.debit
           END
         ) AS balance
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_id
       JOIN chart_of_accounts coa ON coa.id = jl.account_id
       WHERE je.tenant_id = $1
         AND je.entry_date <= $2
         AND je.status = 'POSTED'
       GROUP BY jl.account_id, jl.currency`,
      [ctx.tenantId, ctx.eodDate]
    );

    for (const row of balances) {
      try {
        await ctx.db.query(
          `INSERT INTO eod_snapshots
             (tenant_id, snapshot_date, account_id, closing_balance, currency)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tenant_id, snapshot_date, account_id)
           DO UPDATE SET closing_balance = EXCLUDED.closing_balance`,
          [ctx.tenantId, ctx.eodDate, row.account_id, row.balance, row.currency]
        );
        saved++;
      } catch (err) {
        errors.push(`Snapshot insert failed for account=${row.account_id}: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Snapshot query failed: ${err}`);
  }

  return {
    step: 11,
    name: 'EOD Snapshot',
    success: errors.length === 0,
    recordsProcessed: saved,
    errors,
    durationMs: Date.now() - start,
  };
}
