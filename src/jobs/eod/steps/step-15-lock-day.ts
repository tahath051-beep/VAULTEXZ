// Step 15: Lock the day — no modifications allowed after this
// Sets status = 'LOCKED' in eod_processing_log
// The lock is checked in step-01 on any subsequent run — throws if locked

import type { EODContext, StepResult } from '../../../types/eod';

export async function step15LockDay(
  ctx: EODContext,
  stepResults: object[],
  lockedBy?: string
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];

  try {
    await ctx.db.query(
      `UPDATE eod_processing_log
       SET status       = 'LOCKED',
           locked_at    = NOW(),
           locked_by    = $3,
           completed_at = NOW(),
           step_results = $4
       WHERE tenant_id = $1 AND eod_date = $2`,
      [
        ctx.tenantId,
        ctx.eodDate,
        lockedBy ?? null,
        JSON.stringify(stepResults),
      ]
    );
  } catch (err) {
    errors.push(`Lock failed: ${err}`);
  }

  return {
    step: 15,
    name: 'Lock Day',
    success: errors.length === 0,
    recordsProcessed: 1,
    errors,
    durationMs: Date.now() - start,
  };
}
