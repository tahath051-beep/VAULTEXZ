// EOD helper functions consumed by eod.runner.ts
// Replaces the stubs: getMT5FxRates + getMT5TotalEquity

import { getFxRates, getAccountEquities } from './mt5.bridge';
import type { FxRateInput } from '../../jobs/eod/steps/step-08-pull-fx-rates';

// Convert a 6-char MT5 symbol to { from, to } currency codes
// Works for EURUSD → EUR/USD, XAUUSD → XAU/USD, USDJPY → USD/JPY
function parseSymbol(symbol: string): { from: string; to: string } | null {
  if (symbol.length !== 6) return null;
  return { from: symbol.slice(0, 3), to: symbol.slice(3, 6) };
}

export async function getMT5FxRates(_tenantId: string): Promise<FxRateInput[]> {
  try {
    const rates = await getFxRates();
    const result: FxRateInput[] = [];

    for (const r of rates) {
      const parsed = parseSymbol(r.symbol);
      if (!parsed) continue;
      result.push({
        fromCurrency: parsed.from,
        toCurrency:   parsed.to,
        rate:         (r.bid + r.ask) / 2,
        source:       'MT5',
      });
    }

    return result;
  } catch (err) {
    console.error('[MT5 EOD] getFxRates failed:', err);
    return [];
  }
}

export async function getMT5TotalEquity(_tenantId: string): Promise<number> {
  try {
    const [equities, rates] = await Promise.all([
      getAccountEquities(),
      getFxRates(),
    ]);

    // Build mid-rate lookup: 'EURUSD' → mid
    const rateMap = new Map<string, number>();
    for (const r of rates) {
      rateMap.set(r.symbol, (r.bid + r.ask) / 2);
    }

    let totalUSD = 0;

    for (const acct of equities) {
      if (acct.currency === 'USD') {
        totalUSD += acct.equity;
        continue;
      }

      // Try direct rate (e.g. EURUSD for EUR accounts)
      const direct = rateMap.get(`${acct.currency}USD`);
      if (direct) {
        totalUSD += acct.equity * direct;
        continue;
      }

      // Try inverse rate (e.g. USDJPY → divide for JPY accounts)
      const inverse = rateMap.get(`USD${acct.currency}`);
      if (inverse && inverse !== 0) {
        totalUSD += acct.equity / inverse;
        continue;
      }

      // Cannot convert — skip with warning
      console.warn(`[MT5 EOD] No FX rate for ${acct.currency}/USD — login ${acct.login} excluded from equity`);
    }

    return Math.round(totalUSD * 100) / 100;
  } catch (err) {
    console.error('[MT5 EOD] getTotalEquity failed:', err);
    return 0;
  }
}
