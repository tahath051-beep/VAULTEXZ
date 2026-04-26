// EOD BullMQ Queue — scheduled at 00:00 per tenant timezone
// Queue: one worker per tenant, processes one EOD job at a time

import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { runEOD } from './eod.runner';
import type { EODJobData } from '../../types/eod';

const QUEUE_NAME = 'eod-processing';

export const eodQueue = new Queue<EODJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: 'exponential', delay: 60_000 },  // 1min, 2min, 4min
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50  },
  },
});

// Schedule EOD for a specific tenant — called by cron at 00:00 tenant time
export async function scheduleEOD(
  tenantId: string,
  eodDate:  string,  // 'YYYY-MM-DD'
  triggeredBy = 'system'
): Promise<void> {
  const jobId = `eod:${tenantId}:${eodDate}`;

  // Deduplicate: skip if job already queued or running
  const existing = await eodQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (['waiting', 'active', 'delayed'].includes(state)) {
      console.log(`EOD job already ${state} for tenant=${tenantId} date=${eodDate}`);
      return;
    }
  }

  await eodQueue.add(
    'run-eod',
    { tenantId, eodDate, triggeredBy },
    { jobId }
  );

  console.log(`EOD queued: tenant=${tenantId} date=${eodDate}`);
}

// Worker — processes one tenant's EOD at a time
export function startEODWorker(): Worker<EODJobData> {
  const worker = new Worker<EODJobData>(
    QUEUE_NAME,
    async (job: Job<EODJobData>) => {
      console.log(
        `[EOD] Starting: tenant=${job.data.tenantId} date=${job.data.eodDate} ` +
        `attempt=${job.attemptsMade + 1}`
      );

      const result = await runEOD(job.data);

      console.log(
        `[EOD] Finished: tenant=${job.data.tenantId} date=${job.data.eodDate} ` +
        `success=${result.success} duration=${result.totalDurationMs}ms`
      );

      if (!result.success) {
        const failedSteps = result.steps.filter(s => !s.success).map(s => s.name);
        throw new Error(`EOD failed at steps: ${failedSteps.join(', ')}`);
      }

      return result;
    },
    {
      connection: redis,
      concurrency: 1,  // process one EOD at a time globally
    }
  );

  worker.on('failed', (job, err) => {
    console.error(
      `[EOD] Failed: tenant=${job?.data.tenantId} date=${job?.data.eodDate}`,
      err.message
    );
  });

  worker.on('error', (err) => {
    console.error('[EOD] Worker error:', err);
  });

  return worker;
}
