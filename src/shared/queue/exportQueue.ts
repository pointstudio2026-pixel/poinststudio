import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type { EnqueueExportInput, ExportQueuePort } from "@/modules/exports/domain/ExportQueuePort";

export const EXPORT_QUEUE_NAME = "export";

const globalForQueue = globalThis as unknown as { exportQueue?: Queue };

export const exportQueue =
  globalForQueue.exportQueue ??
  new Queue(EXPORT_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.exportQueue = exportQueue;
}

export class BullMqExportQueue implements ExportQueuePort {
  async enqueue(input: EnqueueExportInput): Promise<void> {
    await exportQueue.add("export", input);
  }
}
