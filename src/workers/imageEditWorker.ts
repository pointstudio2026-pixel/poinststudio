import { Worker, type Job } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { IMAGE_EDIT_QUEUE_NAME } from "@/shared/queue/imageEditQueue";
import type { ProcessEditJobUseCase } from "@/modules/edits/application/ProcessEditJobUseCase";
import { logger } from "@/shared/logging/logger";

interface ImageEditJobData {
  editHistoryId: string;
  requestedByUserId: string;
}

/** Mirrors imageGenerationWorker.ts's shape -- see that file's docstring for why the wired Use Case is a parameter, not an import. */
export function startImageEditWorker(processUseCase: ProcessEditJobUseCase): Worker {
  const worker = new Worker<ImageEditJobData>(
    IMAGE_EDIT_QUEUE_NAME,
    async (job: Job<ImageEditJobData>) => {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      await processUseCase.execute({
        editHistoryId: job.data.editHistoryId,
        requestedByUserId: job.data.requestedByUserId,
        isFinalAttempt,
      });
    },
    { connection: bullMqConnectionOptions, concurrency: 2 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Image edit worker job failed", {
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
    logger.error("Image edit worker connection error", {
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
