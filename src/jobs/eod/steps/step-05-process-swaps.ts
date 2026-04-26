// Step 05: Process swap entries for all accounts with non-zero swap on eodDate
// Section 5:
//   Swap expense (negative swap, broker pays client):
//     DR Swap Expense (5300) / CR Client Payable (2100)
//   Swap income (positive swap, charged to client):
//     DR Client Payable (2100) / CR Swap Income (4500)

import type { EODContext, StepResult } from '../../../types/eod';
import {
  postSwapExpense,
  postSwapIncome,
  appendClientLedger,
} from '../../../services/journal.service';

export async function step05ProcessSwaps(ctx: EODContext): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   posted = 0;

  // Pull all trades closed on eodDate that have non-zero swap and were already posted
  const { rows: swapTrades } = await ctx.db.query<{
    id: string;
    mt5_account_id: string;
    mt5_ticket: number;
    symbol: string;
    swap: string;
  }>(
    `SELECT id, mt5_account_id, mt5_ticket, symbol, swap
     FROM trades
     WHERE tenant_id = $1
       AND close_time::date = $2
       AND journal_posted = true
       AND ABS(swap::numeric) > 0.000001`,
    [ctx.tenantId, ctx.eodDate]
  );

  for (const trade of swapTrades) {
    const swap = parseFloat(trade.swap);
    const abs  = Math.abs(swap);

    try {
      await ctx.db.query('BEGIN');

      let journalId: string;
      if (swap < 0) {
        // Broker pays client — expense
        journalId = await postSwapExpense(
          ctx.db, ctx.tenantId, ctx.eodDate,
          trade.mt5_account_id, abs,
          `Swap expense ticket#${trade.mt5_ticket} ${trade.symbol}`
        );
        await appendClientLedger(
          ctx.db, ctx.tenantId, trade.mt5_account_id,
          'SWAP', swap, 'USD',
          trade.id, 'TRADE', journalId,
          `Swap expense ticket#${trade.mt5_ticket}`
        );
      } else {
        // Client pays broker — income
        journalId = await postSwapIncome(
          ctx.db, ctx.tenantId, ctx.eodDate,
          trade.mt5_account_id, abs,
          `Swap income ticket#${trade.mt5_ticket} ${trade.symbol}`
        );
        await appendClientLedger(
          ctx.db, ctx.tenantId, trade.mt5_account_id,
          'SWAP', -abs, 'USD',
          trade.id, 'TRADE', journalId,
          `Swap income ticket#${trade.mt5_ticket}`
        );
      }

      await ctx.db.query('COMMIT');
      posted++;
    } catch (err) {
      await ctx.db.query('ROLLBACK');
      errors.push(`Swap failed ticket=${trade.mt5_ticket}: ${err}`);
    }
  }

  return {
    step: 5,
    name: 'Process Swaps',
    success: errors.length === 0,
    recordsProcessed: posted,
    errors,
    durationMs: Date.now() - start,
  };
}
