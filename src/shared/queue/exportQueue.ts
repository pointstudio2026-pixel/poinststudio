import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import type { EnqueueExportInput, ExportQueuePort } from "@/modules/exports/domain/ExportQueuePort";
import { logger } from "@/shared/logging/logger";

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

// Same reasoning as the Worker's "error" listener (see exportWorker.ts): an
// unhandled "error" event on this Queue's EventEmitter would crash the process.
exportQueue.on("error", (err) => {
  logger.error("Export queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

export class BullMqExportQueue implements ExportQueuePort {
  async enqueue(input: EnqueueExportInput): Promise<void> {
    await exportQueue.add("export", input);
  }
}
