// Step 10: Post FX revaluation journal entries
// Section 5:
//   Gain: DR FX Reval Asset (1600)     / CR FX Gain (4600)
//   Loss: DR FX Reval Loss  (5700)     / CR FX Reval Liability (2400)

import type { EODContext, StepResult } from '../../../types/eod';
import type { RevalEntry } from './step-09-fx-revaluation';
import { postFXRevaluation } from '../../../services/journal.service';

export async function step10PostFXJournals(
  ctx: EODContext,
  revalEntries: RevalEntry[]
): Promise<StepResult> {
  const start  = Date.now();
  const errors: string[] = [];
  let   posted = 0;

  // Aggregate gain and loss separately — post two journals total
  const totalGain = round6(
    revalEntries.filter(e => e.revalAmount > 0).reduce((s, e) => s + e.revalAmount, 0)
  );
  const totalLoss = round6(
    Math.abs(revalEntries.filter(e => e.revalAmount < 0).reduce((s, e) => s + e.revalAmount, 0))
  );

  try {
    if (totalGain > 0.000001) {
      await ctx.db.query('BEGIN');
      await postFXRevaluation(
        ctx.db, ctx.tenantId, ctx.eodDate,
        totalGain, true,
        `EOD FX revaluation gain ${ctx.eodDate}`
      );
      await ctx.db.query('COMMIT');
      posted++;
    }
  } catch (err) {
    await ctx.db.query('ROLLBACK');
    errors.push(`FX gain journal failed: ${err}`);
  }

  try {
    if (totalLoss > 0.000001) {
      await ctx.db.query('BEGIN');
      await postFXRevaluation(
        ctx.db, ctx.tenantId, ctx.eodDate,
        totalLoss, false,
        `EOD FX revaluation loss ${ctx.eodDate}`
      );
      await ctx.db.query('COMMIT');
      posted++;
    }
  } catch (err) {
    await ctx.db.query('ROLLBACK');
    errors.push(`FX loss journal failed: ${err}`);
  }

  return {
    step: 10,
    name: 'Post FX Revaluation Journals',
    success: errors.length === 0,
    recordsProcessed: posted,
    errors,
    durationMs: Date.now() - start,
  };
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
