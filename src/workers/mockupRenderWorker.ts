import { Worker, type Job } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { MOCKUP_RENDER_QUEUE_NAME } from "@/shared/queue/mockupRenderQueue";
import type { ProcessMockupJobUseCase } from "@/modules/mockups/application/ProcessMockupJobUseCase";
import { logger } from "@/shared/logging/logger";

interface MockupRenderJobData {
  mockupId: string;
}

/** Mirrors imageGenerationWorker.ts/imageEditWorker.ts's shape. */
export function startMockupRenderWorker(processUseCase: ProcessMockupJobUseCase): Worker {
  const worker = new Worker<MockupRenderJobData>(
    MOCKUP_RENDER_QUEUE_NAME,
    async (job: Job<MockupRenderJobData>) => {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      await processUseCase.execute({ mockupId: job.data.mockupId, isFinalAttempt });
    },
    { connection: bullMqConnectionOptions, concurrency: 2 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Mockup render worker job failed", {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
