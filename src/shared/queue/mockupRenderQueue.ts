import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type {
  EnqueueMockupRenderInput,
  MockupRenderQueuePort,
} from "@/modules/mockups/domain/MockupRenderQueuePort";

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

export class BullMqMockupRenderQueue implements MockupRenderQueuePort {
  async enqueue(input: EnqueueMockupRenderInput): Promise<void> {
    await mockupRenderQueue.add("render", input);
  }
}
