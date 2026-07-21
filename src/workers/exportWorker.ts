import { Worker, type Job } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { EXPORT_QUEUE_NAME } from "@/shared/queue/exportQueue";
import type { ProcessExportJobUseCase } from "@/modules/exports/application/ProcessExportJobUseCase";
import { logger } from "@/shared/logging/logger";

interface ExportJobData {
  exportId: string;
  requestedByUserId: string;
}

/** Mirrors the other worker files' shape. */
export function startExportWorker(processUseCase: ProcessExportJobUseCase): Worker {
  const worker = new Worker<ExportJobData>(
    EXPORT_QUEUE_NAME,
    async (job: Job<ExportJobData>) => {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      await processUseCase.execute({
        exportId: job.data.exportId,
        requestedByUserId: job.data.requestedByUserId,
        isFinalAttempt,
      });
    },
    { connection: bullMqConnectionOptions, concurrency: 2 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Export worker job failed", {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  // BullMQ Workers are EventEmitters -- an unhandled "error" event (e.g. a
  // transient Redis reconnect) throws and crashes the whole process, which
  // orphans every job the worker currently holds a lock on ("active"
  // forever, never picked back up). Must always have a listener.
  worker.on("error", (err) => {
    logger.error("Export worker connection error", {
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
