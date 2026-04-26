// Step 04: Post journal entries for all closed trades
// Section 5 rules:
//   A-Book: DR LP Account (1300) / CR Spread Income (41xx)
//   B-Book client_loss: DR Client Payable (2100) / CR Spread Income B (4200) / CR B-Book P&L Income (4300)
//   B-Book client_profit: DR Spread Income B (4200) / DR B-Book P&L Loss (5200) / CR Client Payable (2100)
//   Commission (if any): DR Client Payable (2100) / CR Commission Income (4400)

import type { EODContext, StepResult } from '../../../types/eod';
import type { SpreadCalcTrade } from './step-03-calc-spread';
import {
  postTradeCloseABook,
  postTradeCloseBBookLoss,
  postTradeCloseBBookProfit,
  postCommission,
  appendClientLedger,
} from '../../../services/journal.service';

export async function step04PostTradeJournals(
  ctx: EODContext,
  trades: SpreadCalcTrade[],
  clientMap: Map<string, string>
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   posted = 0;

  for (const trade of trades) {
    const mt5Profit = parseFloat(trade.mt5_profit);
    const commission = parseFloat(trade.commission);

    try {
      await ctx.db.query('BEGIN');

      let journalId: string;
      const narrationBase =
        `${trade.book_type}-Book ${trade.symbol} ${trade.direction} ` +
        `${trade.volume}L ticket#${trade.mt5_ticket}`;

      if (trade.book_type === 'A') {
        journalId = await postTradeCloseABook(
          ctx.db,
          ctx.tenantId,
          ctx.eodDate,
          trade.id,
          trade.spreadIncome,
          trade.symbolConfig.asset_class,
          `A-Book close: ${narrationBase}`
        );
      } else {
        // B-Book: determine direction
        if (mt5Profit <= 0) {
          journalId = await postTradeCloseBBookLoss(
            ctx.db,
            ctx.tenantId,
            ctx.eodDate,
            trade.id,
            trade.spreadIncome,
            mt5Profit,
            `B-Book close (client loss): ${narrationBase}`
          );
        } else {
          journalId = await postTradeCloseBBookProfit(
            ctx.db,
            ctx.tenantId,
            ctx.eodDate,
            trade.id,
            trade.spreadIncome,
            mt5Profit,
            `B-Book close (client profit): ${narrationBase}`
          );
        }
      }

      // Post commission as separate journal line if non-zero
      if (Math.abs(commission) > 0.000001) {
        await postCommission(
          ctx.db,
          ctx.tenantId,
          ctx.eodDate,
          trade.id,
          Math.abs(commission),
          `Commission: ${narrationBase}`
        );
      }

      // Update client ledger with realised P&L
      await appendClientLedger(
        ctx.db,
        ctx.tenantId,
        trade.mt5_account_id,
        'TRADE_PNL',
        mt5Profit,
        'USD',
        trade.id,
        'TRADE',
        journalId,
        `Realised P&L: ${narrationBase}`
      );

      // If commission, also deduct from client ledger
      if (Math.abs(commission) > 0.000001) {
        await appendClientLedger(
          ctx.db,
          ctx.tenantId,
          trade.mt5_account_id,
          'COMMISSION',
          -Math.abs(commission),
          'USD',
          trade.id,
          'TRADE',
          journalId,
          `Commission: ${narrationBase}`
        );
      }

      // Mark journal_posted = true on trade
      await ctx.db.query(
        `UPDATE trades SET journal_posted = true WHERE id = $1 AND tenant_id = $2`,
        [trade.id, ctx.tenantId]
      );

      await ctx.db.query('COMMIT');
      posted++;
    } catch (err) {
      await ctx.db.query('ROLLBACK');
      const msg = `Journal failed for ticket=${trade.mt5_ticket}: ${err}`;
      errors.push(msg);

      // Log to sync_errors for manual queue
      await ctx.db.query(
        `INSERT INTO sync_errors
           (tenant_id, mt5_ticket, error_type, error_message, resolved)
         VALUES ($1, $2, 'JOURNAL_FAILED', $3, false)`,
        [ctx.tenantId, trade.mt5_ticket, msg]
      );
    }
  }

  return {
    step: 4,
    name: 'Post Trade Journals',
    success: errors.length === 0,
    recordsProcessed: posted,
    errors,
    durationMs: Date.now() - start,
  };
}
