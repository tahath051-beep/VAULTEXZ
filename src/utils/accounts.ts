import type { PoolClient } from 'pg';

// Batch-fetch account UUIDs by code for a tenant.
// Throws if any requested code is missing or inactive.
export async function getAccountIds(
  db: PoolClient,
  tenantId: string,
  codes: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(codes)];
  const { rows } = await db.query<{ code: string; id: string }>(
    `SELECT code, id
     FROM chart_of_accounts
     WHERE tenant_id = $1
       AND code = ANY($2)
       AND is_active = true`,
    [tenantId, unique]
  );

  const map = new Map(rows.map(r => [r.code, r.id]));

  for (const code of unique) {
    if (!map.has(code)) {
      throw new Error(`Account code ${code} not found or inactive for tenant ${tenantId}`);
    }
  }
  return map;
}

// Spread income account code by asset class
export function spreadIncomeAccount(assetClass: string | null): string {
  switch (assetClass?.toUpperCase()) {
    case 'FOREX':   return '4110';
    case 'METALS':  return '4120';
    case 'INDICES': return '4130';
    case 'CRYPTO':  return '4140';
    default:        return '4100';
  }
}
