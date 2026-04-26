// Step 14: Flag any breaks or errors for review
// Checks: unresolved sync_errors, recon breaks, journal failures

import type { EODContext, StepResult } from '../../../types/eod';

export interface FlagSummary {
  unresolvedSyncErrors:  number;
  reconBreak:            boolean;
  journalFailures:       number;
  requiresCFOAlert:      boolean;
}

export async function step14FlagErrors(
  ctx: EODContext
): Promise<StepResult & { flags: FlagSummary }> {
  const start = Date.now();
  const errors: string[] = [];

  const [syncErrCount, reconRow, journalFailCount] = await Promise.all([
    ctx.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sync_errors
       WHERE tenant_id = $1 AND resolved = false`,
      [ctx.tenantId]
    ),
    ctx.db.query<{ status: string }>(
      `SELECT status FROM daily_reconciliation
       WHERE tenant_id = $1 AND recon_date = $2`,
      [ctx.tenantId, ctx.eodDate]
    ),
    ctx.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sync_errors
       WHERE tenant_id = $1
         AND error_type = 'JOURNAL_FAILED'
         AND created_at::date = $2
         AND resolved = false`,
      [ctx.tenantId, ctx.eodDate]
    ),
  ]);

  const unresolvedSyncErrors = parseInt(syncErrCount.rows[0]?.count ?? '0');
  const reconBreak           = reconRow.rows[0]?.status === 'BREAK';
  const journalFailures      = parseInt(journalFailCount.rows[0]?.count ?? '0');
  const requiresCFOAlert     = reconBreak || journalFailures > 0;

  if (unresolvedSyncErrors > 0) errors.push(`${unresolvedSyncErrors} unresolved sync errors`);
  if (reconBreak)               errors.push(`Reconciliation BREAK detected for ${ctx.eodDate}`);
  if (journalFailures > 0)      errors.push(`${journalFailures} journal posting failures`);

  const flags: FlagSummary = {
    unresolvedSyncErrors,
    reconBreak,
    journalFailures,
    requiresCFOAlert,
  };

  return {
    step: 14,
    name: 'Flag Errors',
    success: !requiresCFOAlert,
    recordsProcessed: unresolvedSyncErrors + journalFailures,
    errors,
    durationMs: Date.now() - start,
    flags,
  };
}
