// Step 09: Calculate FX revaluation on non-USD client balances
// Finds accounts with non-USD currency, compares current balance
// at today's rate vs yesterday's rate, computes gain/loss

import type { EODContext, StepResult } from '../../../types/eod';

export interface RevalEntry {
  mt5AccountId: string;
  currency:     string;
  balance:      number;
  prevRate:     number;
  currRate:     number;
  revalAmount:  number;  // positive = gain, negative = loss
}

export async function step09FXRevaluation(
  ctx: EODContext
): Promise<StepResult & { revalEntries: RevalEntry[] }> {
  const start  = Date.now();
  const errors: string[] = [];
  const revalEntries: RevalEntry[] = [];

  const prevDate = getPrevDate(ctx.eodDate);

  // Get all non-USD accounts with a client ledger balance
  const { rows: accounts } = await ctx.db.query<{
    id: string; currency: string;
  }>(
    `SELECT DISTINCT a.id, a.currency
     FROM mt5_accounts a
     JOIN client_ledger cl ON cl.mt5_account_id = a.id
     WHERE a.tenant_id = $1
       AND a.currency <> 'USD'
       AND a.is_active = true`,
    [ctx.tenantId]
  );

  for (const acct of accounts) {
    try {
      // Current running balance for this account
      const { rows: [bal] } = await ctx.db.query<{ balance_after: string }>(
        `SELECT balance_after FROM client_ledger
         WHERE mt5_account_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [acct.id]
      );
      if (!bal) continue;

      const balance = parseFloat(bal.balance_after);
      if (Math.abs(balance) < 0.000001) continue;

      // Today's FX rate
      const { rows: [curr] } = await ctx.db.query<{ rate: string }>(
        `SELECT rate FROM fx_rates
         WHERE tenant_id = $1 AND rate_date = $2
           AND from_currency = $3 AND to_currency = 'USD'`,
        [ctx.tenantId, ctx.eodDate, acct.currency]
      );

      // Yesterday's FX rate
      const { rows: [prev] } = await ctx.db.query<{ rate: string }>(
        `SELECT rate FROM fx_rates
         WHERE tenant_id = $1 AND rate_date = $2
           AND from_currency = $3 AND to_currency = 'USD'`,
        [ctx.tenantId, prevDate, acct.currency]
      );

      if (!curr || !prev) continue;

      const currRate = parseFloat(curr.rate);
      const prevRate = parseFloat(prev.rate);
      const revalAmount = round6(balance * (currRate - prevRate));

      if (Math.abs(revalAmount) > 0.000001) {
        revalEntries.push({
          mt5AccountId: acct.id,
          currency:     acct.currency,
          balance,
          prevRate,
          currRate,
          revalAmount,
        });
      }
    } catch (err) {
      errors.push(`FX reval failed for account=${acct.id}: ${err}`);
    }
  }

  return {
    step: 9,
    name: 'FX Revaluation Calculation',
    success: errors.length === 0,
    recordsProcessed: revalEntries.length,
    errors,
    durationMs: Date.now() - start,
    revalEntries,
  };
}

function getPrevDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
