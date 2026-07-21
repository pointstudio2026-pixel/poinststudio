import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type {
  EnqueueMockupRenderInput,
  MockupRenderQueuePort,
} from "@/modules/mockups/domain/MockupRenderQueuePort";
import { logger } from "@/shared/logging/logger";

export const MOCKUP_RENDER_QUEUE_NAME = "mockup-render";

const globalForQueue = globalThis as unknown as { mockupRenderQueue?: Queue };

export const mockupRenderQueue =
  globalForQueue.mockupRenderQueue ??
  new Queue(MOCKUP_RENDER_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.mockupRenderQueue = mockupRenderQueue;
}

// Same reasoning as the Worker's "error" listener (see mockupRenderWorker.ts):
// an unhandled "error" event on this Queue's EventEmitter would crash the process.
mockupRenderQueue.on("error", (err) => {
  logger.error("Mockup render queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

export class BullMqMockupRenderQueue implements MockupRenderQueuePort {
  async enqueue(input: EnqueueMockupRenderInput): Promise<void> {
    await mockupRenderQueue.add("render", input);
  }
}
