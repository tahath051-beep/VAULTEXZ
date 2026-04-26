import type { PoolClient } from 'pg';
import type { IBCommissionCalc } from '../types/eod';

// Walk the IB hierarchy (max 3 levels) for a given client.
// Returns commission calcs for each active level.
export async function calculateIBCommissions(
  db: PoolClient,
  tenantId: string,
  clientId: string,
  tradeSymbol: string,
  volume: number,
  spreadIncome: number,
  tradeDate: string
): Promise<IBCommissionCalc[]> {
  // Find client's root IB
  const { rows: [client] } = await db.query<{ ib_id: string | null }>(
    `SELECT ib_id FROM clients WHERE id = $1 AND tenant_id = $2`,
    [clientId, tenantId]
  );

  if (!client?.ib_id) return [];

  const results: IBCommissionCalc[] = [];
  let currentIbId: string | null = client.ib_id;

  while (currentIbId && results.length < 3) {
    const { rows: [ib] } = await db.query<{
      id: string; level: number; parent_ib_id: string | null;
    }>(
      `SELECT id, level, parent_ib_id FROM ibs
       WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [currentIbId, tenantId]
    );

    if (!ib) break;

    // Find commission plan: prefer symbol-specific, fall back to NULL (all symbols)
    const { rows: [plan] } = await db.query<{
      commission_type: 'PER_LOT' | 'SPREAD_SHARE' | 'FLAT_FEE';
      rate: string;
      currency: string;
    }>(
      `SELECT commission_type, rate, currency
       FROM ib_commission_plans
       WHERE tenant_id = $1
         AND ib_id = $2
         AND is_active = true
         AND effective_from <= $3
         AND (effective_to IS NULL OR effective_to >= $3)
         AND (symbol = $4 OR symbol IS NULL)
       ORDER BY symbol NULLS LAST
       LIMIT 1`,
      [tenantId, ib.id, tradeDate, tradeSymbol]
    );

    if (plan) {
      const rate         = parseFloat(plan.rate);
      const grossAmount  = calcCommission(plan.commission_type, rate, volume, spreadIncome);

      if (grossAmount > 0) {
        results.push({
          ibId:           ib.id,
          ibLevel:        ib.level,
          commissionType: plan.commission_type,
          rate,
          grossAmount:    round6(grossAmount),
          currency:       plan.currency,
        });
      }
    }

    currentIbId = ib.parent_ib_id;
  }

  return results;
}

function calcCommission(
  type: 'PER_LOT' | 'SPREAD_SHARE' | 'FLAT_FEE',
  rate: number,
  volume: number,
  spreadIncome: number
): number {
  switch (type) {
    case 'PER_LOT':      return rate * volume;
    case 'SPREAD_SHARE': return (rate / 100) * spreadIncome;
    case 'FLAT_FEE':     return rate;
  }
}

// Persist calculated commissions to ib_commission_ledger
export async function insertIBCommissionLedger(
  db: PoolClient,
  tenantId: string,
  tradeId: string,
  commissions: IBCommissionCalc[],
  settlementDate: string,
  journalId: string
): Promise<void> {
  for (const c of commissions) {
    await db.query(
      `INSERT INTO ib_commission_ledger
         (tenant_id, ib_id, trade_id, ib_level, commission_type,
          gross_amount, currency, status, settlement_date, journal_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',$8,$9)`,
      [
        tenantId, c.ibId, tradeId, c.ibLevel, c.commissionType,
        c.grossAmount, c.currency, settlementDate, journalId,
      ]
    );
  }
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
