// Step 02: Validate all trades
// Section 8: check symbol exists in symbol_config, mt5_login in mt5_accounts
// Invalid trades → sync_errors table, removed from processing set

import type { EODContext, StepResult, TradeRow, SymbolConfigRow } from '../../../types/eod';

export interface ValidationResult {
  validTrades: TradeRow[];
  symbolMap:   Map<string, SymbolConfigRow>;
  clientMap:   Map<string, string>;   // mt5_account_id → client_id
}

export async function step02ValidateTrades(
  ctx: EODContext,
  trades: TradeRow[]
): Promise<StepResult & ValidationResult> {
  const start  = Date.now();
  const errors: string[] = [];
  const validTrades: TradeRow[]              = [];
  const symbolMap   = new Map<string, SymbolConfigRow>();
  const clientMap   = new Map<string, string>();

  // Pre-load all symbols needed
  const symbols = [...new Set(trades.map(t => t.symbol))];
  if (symbols.length > 0) {
    const { rows: symbolRows } = await ctx.db.query<SymbolConfigRow>(
      `SELECT id, symbol, pip_value_usd, broker_spread, lp_spread,
              markup_spread, contract_size, asset_class
       FROM symbol_config
       WHERE tenant_id = $1
         AND symbol = ANY($2)
         AND is_active = true
         AND effective_from <= $3
         AND (effective_to IS NULL OR effective_to >= $3)`,
      [ctx.tenantId, symbols, ctx.eodDate]
    );
    for (const row of symbolRows) {
      symbolMap.set(row.symbol, row);
    }
  }

  // Pre-load mt5_account_id → client_id mapping
  const accountIds = [...new Set(trades.map(t => t.mt5_account_id))];
  if (accountIds.length > 0) {
    const { rows: accountRows } = await ctx.db.query<{
      id: string; client_id: string;
    }>(
      `SELECT id, client_id FROM mt5_accounts
       WHERE tenant_id = $1 AND id = ANY($2) AND is_active = true`,
      [ctx.tenantId, accountIds]
    );
    for (const row of accountRows) {
      clientMap.set(row.id, row.client_id);
    }
  }

  for (const trade of trades) {
    let valid = true;

    if (!symbolMap.has(trade.symbol)) {
      const msg = `MISSING_SYMBOL: ticket=${trade.mt5_ticket} symbol=${trade.symbol}`;
      errors.push(msg);
      await insertSyncError(ctx, trade, 'MISSING_SYMBOL', msg);
      valid = false;
    }

    if (!clientMap.has(trade.mt5_account_id)) {
      const msg = `MISSING_ACCOUNT: ticket=${trade.mt5_ticket} account=${trade.mt5_account_id}`;
      errors.push(msg);
      await insertSyncError(ctx, trade, 'UNKNOWN', msg);
      valid = false;
    }

    if (valid) validTrades.push(trade);
  }

  return {
    step: 2,
    name: 'Validate Trades',
    success: errors.length === 0,
    recordsProcessed: validTrades.length,
    errors,
    durationMs: Date.now() - start,
    validTrades,
    symbolMap,
    clientMap,
  };
}

async function insertSyncError(
  ctx: EODContext,
  trade: TradeRow,
  errorType: string,
  message: string
): Promise<void> {
  await ctx.db.query(
    `INSERT INTO sync_errors
       (tenant_id, mt5_ticket, error_type, error_message, raw_data, resolved)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [
      ctx.tenantId,
      trade.mt5_ticket,
      errorType,
      message,
      JSON.stringify({ trade }),
    ]
  );
}
