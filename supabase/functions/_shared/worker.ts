/**
 * Background Worker
 * Processes jobs from the queue with retry logic
 */

import { drain, complete, fail } from "./queue.ts";

export type JobHandler = (job: any) => Promise<void>;

/**
 * Processes a batch of jobs
 */
export async function tick(
  supabase: any,
  handler: JobHandler,
  batchSize: number = 10
): Promise<{ processed: number; failed: number }> {
  const jobs = await drain(supabase, batchSize);
  
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    if (!job.id) {
      console.error("Job missing ID, skipping");
      continue;
    }

    try {
      await handler(job);
      await complete(supabase, job.id);
      processed++;
      console.log(`Job ${job.id} completed successfully`);
    } catch (error: any) {
      await fail(supabase, job.id, error.message);
      failed++;
      console.error(`Job ${job.id} failed:`, error.message);
    }
  }

  return { processed, failed };
}

/**
 * Runs worker continuously
 */
export async function runWorker(
  supabase: any,
  handler: JobHandler,
  intervalMs: number = 5000
): Promise<void> {
  console.log("Worker started");

  while (true) {
    try {
      const result = await tick(supabase, handler);
      
      if (result.processed > 0 || result.failed > 0) {
        console.log(`Worker tick: ${result.processed} processed, ${result.failed} failed`);
      }
    } catch (error) {
      console.error("Worker error:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
