import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type { EnqueueImageEditInput, ImageEditQueuePort } from "@/modules/edits/domain/ImageEditQueuePort";
import { logger } from "@/shared/logging/logger";

export const IMAGE_EDIT_QUEUE_NAME = "image-edit";

const globalForQueue = globalThis as unknown as { imageEditQueue?: Queue };

export const imageEditQueue =
  globalForQueue.imageEditQueue ??
  new Queue(IMAGE_EDIT_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.imageEditQueue = imageEditQueue;
}

// Same reasoning as the Worker's "error" listener (see imageEditWorker.ts):
// an unhandled "error" event on this Queue's EventEmitter would crash the process.
imageEditQueue.on("error", (err) => {
  logger.error("Image edit queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

export class BullMqImageEditQueue implements ImageEditQueuePort {
  async enqueue(input: EnqueueImageEditInput): Promise<void> {
    await imageEditQueue.add("edit", input);
  }
}
