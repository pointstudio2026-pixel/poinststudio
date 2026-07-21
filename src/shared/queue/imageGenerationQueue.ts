import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type {
  EnqueueImageGenerationInput,
  ImageGenerationQueuePort,
} from "@/modules/generations/domain/ImageGenerationQueuePort";
import { logger } from "@/shared/logging/logger";

export const IMAGE_GENERATION_QUEUE_NAME = "image-generation";

const globalForQueue = globalThis as unknown as { imageGenerationQueue?: Queue };

export const imageGenerationQueue =
  globalForQueue.imageGenerationQueue ??
  new Queue(IMAGE_GENERATION_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.imageGenerationQueue = imageGenerationQueue;
}

// Same reasoning as the Worker's "error" listener (see imageGenerationWorker.ts):
// an unhandled "error" event on this Queue's EventEmitter would crash the process.
imageGenerationQueue.on("error", (err) => {
  logger.error("Image generation queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

/** BullMQ-backed implementation of the ImageGenerationQueuePort the application layer depends on. */
export class BullMqImageGenerationQueue implements ImageGenerationQueuePort {
  async enqueue(input: EnqueueImageGenerationInput): Promise<void> {
    await imageGenerationQueue.add("generate", input);
  }
}
