// Step 06: Calculate IB commissions for all trades posted today
// Section 8: walk IB hierarchy per client (up to 3 levels)
// Commission types: PER_LOT / SPREAD_SHARE / FLAT_FEE

import type { EODContext, StepResult, IBCommissionCalc } from '../../../types/eod';
import { calculateIBCommissions } from '../../../services/ib-commission.service';

export interface TradeCommission {
  tradeId:       string;
  mt5Ticket:     number;
  clientId:      string;
  symbol:        string;
  spreadIncome:  number;
  volume:        number;
  commissions:   IBCommissionCalc[];
}

export async function step06CalcIBCommissions(
  ctx: EODContext,
  clientMap: Map<string, string>
): Promise<StepResult & { tradeCommissions: TradeCommission[] }> {
  const start  = Date.now();
  const errors: string[] = [];
  const tradeCommissions: TradeCommission[] = [];

  // Get all trades posted today with their spread_income
  const { rows: trades } = await ctx.db.query<{
    id: string; mt5_ticket: number; mt5_account_id: string;
    symbol: string; spread_income: string; volume: string;
  }>(
    `SELECT id, mt5_ticket, mt5_account_id, symbol, spread_income, volume
     FROM trades
     WHERE tenant_id = $1
       AND close_time::date = $2
       AND journal_posted = true
       AND spread_income IS NOT NULL`,
    [ctx.tenantId, ctx.eodDate]
  );

  for (const trade of trades) {
    const clientId = clientMap.get(trade.mt5_account_id);
    if (!clientId) continue;

    try {
      const commissions = await calculateIBCommissions(
        ctx.db,
        ctx.tenantId,
        clientId,
        trade.symbol,
        parseFloat(trade.volume),
        parseFloat(trade.spread_income),
        ctx.eodDate
      );

      if (commissions.length > 0) {
        tradeCommissions.push({
          tradeId:      trade.id,
          mt5Ticket:    trade.mt5_ticket,
          clientId,
          symbol:       trade.symbol,
          spreadIncome: parseFloat(trade.spread_income),
          volume:       parseFloat(trade.volume),
          commissions,
        });
      }
    } catch (err) {
      errors.push(`IB calc failed ticket=${trade.mt5_ticket}: ${err}`);
    }
  }

  return {
    step: 6,
    name: 'Calculate IB Commissions',
    success: errors.length === 0,
    recordsProcessed: tradeCommissions.length,
    errors,
    durationMs: Date.now() - start,
    tradeCommissions,
  };
}
