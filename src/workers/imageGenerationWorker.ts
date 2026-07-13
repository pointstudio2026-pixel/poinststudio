import { Worker, type Job } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { IMAGE_GENERATION_QUEUE_NAME } from "@/shared/queue/imageGenerationQueue";
import type { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { logger } from "@/shared/logging/logger";

interface ImageGenerationJobData {
  generationVersionId: string;
}

/**
 * 26_QueueAndJobArchitecture.md / Task-013's mandate: image generation
 * always runs through a Queue, never inline in a Route Handler. Takes the
 * already-wired Use Case as a parameter (rather than importing the
 * container) so this module has no dependency on generations/container.ts
 * -- that container imports *this* file to auto-start the worker, and a
 * two-way import would be circular.
 */
export function startImageGenerationWorker(processUseCase: ProcessGenerationJobUseCase): Worker {
  const worker = new Worker<ImageGenerationJobData>(
    IMAGE_GENERATION_QUEUE_NAME,
    async (job: Job<ImageGenerationJobData>) => {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      await processUseCase.execute({
        generationVersionId: job.data.generationVersionId,
        isFinalAttempt,
      });
    },
    { connection: bullMqConnectionOptions, concurrency: 2 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Image generation worker job failed", {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
