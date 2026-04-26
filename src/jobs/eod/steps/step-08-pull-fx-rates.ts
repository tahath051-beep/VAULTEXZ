// Step 08: Pull EOD FX rates from MT5
// Inserts into fx_rates table (source = 'MT5')
// In production, rates come from MT5 API ticker snapshot at 00:00
// Here we stub the MT5 call — the DB insert logic is complete

import type { EODContext, StepResult } from '../../../types/eod';

export interface FxRateInput {
  fromCurrency: string;
  toCurrency:   string;
  rate:         number;
  source?:      'MT5' | 'MANUAL';
}

// Called by EOD runner — in production the MT5 sync service
// populates rates before EOD; this step upserts them.
export async function step08PullFxRates(
  ctx: EODContext,
  rates: FxRateInput[]  // provided by MT5 sync service
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   saved  = 0;

  for (const r of rates) {
    try {
      await ctx.db.query(
        `INSERT INTO fx_rates
           (tenant_id, rate_date, from_currency, to_currency, rate, source)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, rate_date, from_currency, to_currency)
         DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source`,
        [
          ctx.tenantId, ctx.eodDate,
          r.fromCurrency, r.toCurrency,
          r.rate, r.source ?? 'MT5',
        ]
      );
      saved++;
    } catch (err) {
      errors.push(`FX rate insert failed ${r.fromCurrency}/${r.toCurrency}: ${err}`);
    }
  }

  // Ensure USD/USD baseline exists
  await ctx.db.query(
    `INSERT INTO fx_rates
       (tenant_id, rate_date, from_currency, to_currency, rate, source)
     VALUES ($1, $2, 'USD', 'USD', 1.000000, 'MT5')
     ON CONFLICT DO NOTHING`,
    [ctx.tenantId, ctx.eodDate]
  );

  return {
    step: 8,
    name: 'Pull FX Rates',
    success: errors.length === 0,
    recordsProcessed: saved,
    errors,
    durationMs: Date.now() - start,
  };
}
