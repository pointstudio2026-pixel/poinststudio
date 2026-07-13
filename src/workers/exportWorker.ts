import { Worker, type Job } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { EXPORT_QUEUE_NAME } from "@/shared/queue/exportQueue";
import type { ProcessExportJobUseCase } from "@/modules/exports/application/ProcessExportJobUseCase";
import { logger } from "@/shared/logging/logger";

interface ExportJobData {
  exportId: string;
}

/** Mirrors the other worker files' shape. */
export function startExportWorker(processUseCase: ProcessExportJobUseCase): Worker {
  const worker = new Worker<ExportJobData>(
    EXPORT_QUEUE_NAME,
    async (job: Job<ExportJobData>) => {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      await processUseCase.execute({ exportId: job.data.exportId, isFinalAttempt });
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

  return worker;
}
