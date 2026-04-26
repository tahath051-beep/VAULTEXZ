// Step 03: Calculate spread_income, lp_cost, bbook_pnl, net_broker_pnl
// Section 7: spread_income = markup_spread × volume × pip_value_usd
// Section 8: update trades table with calculated values

import type { EODContext, StepResult, TradeRow, SymbolConfigRow } from '../../../types/eod';
import { calculateSpread } from '../../../services/spread.service';

export interface SpreadCalcTrade extends TradeRow {
  spreadIncome:  number;
  lpCost:        number;
  bbookPnl:      number;
  netBrokerPnl:  number;
  symbolConfig:  SymbolConfigRow;
}

export async function step03CalcSpread(
  ctx: EODContext,
  trades: TradeRow[],
  symbolMap: Map<string, SymbolConfigRow>
): Promise<StepResult & { enrichedTrades: SpreadCalcTrade[] }> {
  const start  = Date.now();
  const errors: string[] = [];
  const enrichedTrades: SpreadCalcTrade[] = [];

  for (const trade of trades) {
    const sym = symbolMap.get(trade.symbol);
    if (!sym) continue;

    const result = calculateSpread(
      {
        markupSpread: parseFloat(sym.markup_spread),
        lpSpread:     parseFloat(sym.lp_spread),
        volume:       parseFloat(trade.volume),
        pipValueUsd:  parseFloat(sym.pip_value_usd),
      },
      trade.book_type,
      parseFloat(trade.mt5_profit)
    );

    // Persist calculated values back to trades row
    try {
      await ctx.db.query(
        `UPDATE trades
         SET spread_income  = $1,
             lp_cost        = $2,
             bbook_pnl      = $3,
             net_broker_pnl = $4
         WHERE id = $5 AND tenant_id = $6`,
        [
          result.spreadIncome,
          result.lpCost,
          result.bbookPnl,
          result.netBrokerPnl,
          trade.id,
          ctx.tenantId,
        ]
      );

      enrichedTrades.push({
        ...trade,
        spreadIncome: result.spreadIncome,
        lpCost:       result.lpCost,
        bbookPnl:     result.bbookPnl,
        netBrokerPnl: result.netBrokerPnl,
        symbolConfig: sym,
      });
    } catch (err) {
      const msg = `Spread calc update failed for ticket=${trade.mt5_ticket}: ${err}`;
      errors.push(msg);
    }
  }

  return {
    step: 3,
    name: 'Calculate Spread Income',
    success: errors.length === 0,
    recordsProcessed: enrichedTrades.length,
    errors,
    durationMs: Date.now() - start,
    enrichedTrades,
  };
}
