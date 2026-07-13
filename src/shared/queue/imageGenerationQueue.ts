import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type {
  EnqueueImageGenerationInput,
  ImageGenerationQueuePort,
} from "@/modules/generations/domain/ImageGenerationQueuePort";

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

/** BullMQ-backed implementation of the ImageGenerationQueuePort the application layer depends on. */
export class BullMqImageGenerationQueue implements ImageGenerationQueuePort {
  async enqueue(input: EnqueueImageGenerationInput): Promise<void> {
    await imageGenerationQueue.add("generate", input);
  }
}
