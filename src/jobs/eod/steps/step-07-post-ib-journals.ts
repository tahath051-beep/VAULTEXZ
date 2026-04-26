// Step 07: Post IB commission journal entries
// Section 5:
//   DR IB Commission Expense (5400) = total of all levels
//   CR IB Payable (2200) L1
//   CR IB Payable (2200) L2  (if any)
//   CR IB Payable (2200) L3  (if any)

import type { EODContext, StepResult } from '../../../types/eod';
import type { TradeCommission } from './step-06-calc-ib-commissions';
import { postIBCommission } from '../../../services/journal.service';
import { insertIBCommissionLedger } from '../../../services/ib-commission.service';

export async function step07PostIBJournals(
  ctx: EODContext,
  tradeCommissions: TradeCommission[]
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   posted = 0;

  // Next month's first day as settlement date (standard 30-day settlement)
  const settlementDate = getNextMonthFirst(ctx.eodDate);

  for (const tc of tradeCommissions) {
    try {
      await ctx.db.query('BEGIN');

      const journalId = await postIBCommission(
        ctx.db,
        ctx.tenantId,
        ctx.eodDate,
        tc.tradeId,
        tc.commissions.map(c => ({
          ibId:   c.ibId,
          amount: c.grossAmount,
          level:  c.ibLevel,
        })),
        `IB commission ticket#${tc.mt5Ticket} ${tc.symbol}`
      );

      await insertIBCommissionLedger(
        ctx.db,
        ctx.tenantId,
        tc.tradeId,
        tc.commissions,
        settlementDate,
        journalId
      );

      await ctx.db.query('COMMIT');
      posted++;
    } catch (err) {
      await ctx.db.query('ROLLBACK');
      errors.push(`IB journal failed for trade=${tc.tradeId}: ${err}`);
    }
  }

  return {
    step: 7,
    name: 'Post IB Commission Journals',
    success: errors.length === 0,
    recordsProcessed: posted,
    errors,
    durationMs: Date.now() - start,
  };
}

function getNextMonthFirst(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}
