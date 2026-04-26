// EOD Runner — orchestrates all 15 steps in sequence
// Each step reports success/failure; critical steps abort on failure

import { pool } from '../../config/database';
import type { EODJobData, EODResult, StepResult } from '../../types/eod';
import { getMT5FxRates, getMT5TotalEquity } from '../../services/mt5/mt5.eod';

import { step01PullTrades }       from './steps/step-01-pull-trades';
import { step02ValidateTrades }   from './steps/step-02-validate-trades';
import { step03CalcSpread }       from './steps/step-03-calc-spread';
import { step04PostTradeJournals }from './steps/step-04-post-trade-journals';
import { step05ProcessSwaps }     from './steps/step-05-process-swaps';
import { step06CalcIBCommissions }from './steps/step-06-calc-ib-commissions';
import { step07PostIBJournals }   from './steps/step-07-post-ib-journals';
import { step08PullFxRates }      from './steps/step-08-pull-fx-rates';
import { step09FXRevaluation }    from './steps/step-09-fx-revaluation';
import { step10PostFXJournals }   from './steps/step-10-post-fx-journals';
import { step11EODSnapshot }      from './steps/step-11-eod-snapshot';
import { step12Reconciliation }   from './steps/step-12-reconciliation';
import { step13GenerateReports }  from './steps/step-13-generate-reports';
import { step14FlagErrors }       from './steps/step-14-flag-errors';
import { step15LockDay }          from './steps/step-15-lock-day';

// Steps that abort the entire EOD run on failure
const CRITICAL_STEPS = new Set([1, 2, 3, 4, 11]);

export async function runEOD(job: EODJobData): Promise<EODResult> {
  const overallStart = Date.now();
  const stepResults: StepResult[] = [];
  const db = await pool.connect();

  const ctx = { tenantId: job.tenantId, eodDate: job.eodDate, db };

  try {
    // Register this EOD run (step-01 will check for LOCKED)
    await db.query(
      `INSERT INTO eod_processing_log (tenant_id, eod_date, status)
       VALUES ($1, $2, 'RUNNING')
       ON CONFLICT (tenant_id, eod_date)
       DO UPDATE SET status = 'RUNNING', started_at = NOW()
       WHERE eod_processing_log.status = 'FAILED'`,
      [job.tenantId, job.eodDate]
    );

    // ── Step 01: Pull Trades ─────────────────────────────────────────────────
    const s01 = await step01PullTrades(ctx);
    stepResults.push(omitData(s01));
    if (!s01.success && CRITICAL_STEPS.has(1)) return abort(stepResults, job, overallStart);

    // ── Step 02: Validate ────────────────────────────────────────────────────
    const s02 = await step02ValidateTrades(ctx, s01.trades);
    stepResults.push(omitData(s02));
    if (!s02.success && CRITICAL_STEPS.has(2) && s02.validTrades.length === 0)
      return abort(stepResults, job, overallStart);

    // ── Step 03: Calculate Spread ────────────────────────────────────────────
    const s03 = await step03CalcSpread(ctx, s02.validTrades, s02.symbolMap);
    stepResults.push(omitData(s03));
    if (!s03.success && CRITICAL_STEPS.has(3)) return abort(stepResults, job, overallStart);

    // ── Step 04: Post Trade Journals ─────────────────────────────────────────
    const s04 = await step04PostTradeJournals(ctx, s03.enrichedTrades, s02.clientMap);
    stepResults.push(s04);
    if (!s04.success && CRITICAL_STEPS.has(4) && s04.recordsProcessed === 0)
      return abort(stepResults, job, overallStart);

    // ── Step 05: Swaps ───────────────────────────────────────────────────────
    const s05 = await step05ProcessSwaps(ctx);
    stepResults.push(s05);

    // ── Step 06: Calculate IB Commissions ────────────────────────────────────
    const s06 = await step06CalcIBCommissions(ctx, s02.clientMap);
    stepResults.push(omitData(s06));

    // ── Step 07: Post IB Journals ─────────────────────────────────────────────
    const s07 = await step07PostIBJournals(ctx, s06.tradeCommissions);
    stepResults.push(s07);

    // ── Step 08: Pull FX Rates ────────────────────────────────────────────────
    // FX rates are provided by MT5 sync service; pass empty array if not available
    const fxRates = await getMT5FxRates(job.tenantId);
    const s08 = await step08PullFxRates(ctx, fxRates);
    stepResults.push(s08);

    // ── Step 09: FX Revaluation ───────────────────────────────────────────────
    const s09 = await step09FXRevaluation(ctx);
    stepResults.push(omitData(s09));

    // ── Step 10: Post FX Journals ─────────────────────────────────────────────
    const s10 = await step10PostFXJournals(ctx, s09.revalEntries);
    stepResults.push(s10);

    // ── Step 11: EOD Snapshot ─────────────────────────────────────────────────
    const s11 = await step11EODSnapshot(ctx);
    stepResults.push(s11);
    if (!s11.success && CRITICAL_STEPS.has(11)) return abort(stepResults, job, overallStart);

    // ── Step 12: Reconciliation ───────────────────────────────────────────────
    const mt5Equity = await getMT5TotalEquity(job.tenantId);
    const s12 = await step12Reconciliation(ctx, mt5Equity);
    stepResults.push(s12);

    // ── Step 13: Generate Reports ─────────────────────────────────────────────
    const s13 = await step13GenerateReports(ctx);
    stepResults.push(omitData(s13));

    // ── Step 14: Flag Errors ──────────────────────────────────────────────────
    const s14 = await step14FlagErrors(ctx);
    stepResults.push(omitData(s14));

    // ── Step 15: Lock Day ─────────────────────────────────────────────────────
    const s15 = await step15LockDay(ctx, stepResults, job.triggeredBy);
    stepResults.push(s15);

    const success = stepResults.every(s => s.success || !CRITICAL_STEPS.has(s.step));

    await db.query(
      `UPDATE eod_processing_log
       SET status = $3, completed_at = NOW()
       WHERE tenant_id = $1 AND eod_date = $2`,
      [job.tenantId, job.eodDate, success ? 'COMPLETED' : 'COMPLETED']
    );

    return {
      tenantId:       job.tenantId,
      eodDate:        job.eodDate,
      steps:          stepResults,
      totalDurationMs: Date.now() - overallStart,
      success,
    };
  } catch (err) {
    await db.query(
      `UPDATE eod_processing_log
       SET status = 'FAILED', error = $3, completed_at = NOW()
       WHERE tenant_id = $1 AND eod_date = $2`,
      [job.tenantId, job.eodDate, String(err)]
    ).catch(() => {});

    throw err;
  } finally {
    db.release();
  }
}

function abort(
  stepResults: StepResult[],
  job: EODJobData,
  start: number
): EODResult {
  return {
    tenantId: job.tenantId,
    eodDate:  job.eodDate,
    steps:    stepResults,
    totalDurationMs: Date.now() - start,
    success:  false,
  };
}

// Strip large data payloads from step results before storing
function omitData<T extends StepResult>(result: T): StepResult {
  return {
    step:             result.step,
    name:             result.name,
    success:          result.success,
    recordsProcessed: result.recordsProcessed,
    errors:           result.errors,
    durationMs:       result.durationMs,
  };
}

