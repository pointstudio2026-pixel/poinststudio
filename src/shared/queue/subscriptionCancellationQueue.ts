import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { logger } from "@/shared/logging/logger";

export const SUBSCRIPTION_CANCELLATION_QUEUE_NAME = "subscription-cancellation";

// giftCodeExpiryQueue와 동일한 이유로 초 단위 정확도가 필요 없다 -- 하루
// 정도 늦게 free로 내려가도 실질적 피해가 없다.
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const globalForQueue = globalThis as unknown as { subscriptionCancellationQueue?: Queue };

export const subscriptionCancellationQueue =
  globalForQueue.subscriptionCancellationQueue ??
  new Queue(SUBSCRIPTION_CANCELLATION_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 20 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.subscriptionCancellationQueue = subscriptionCancellationQueue;
}

subscriptionCancellationQueue.on("error", (err) => {
  logger.error("Subscription cancellation queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

/** 반복 작업 등록(멱등) -- 이미 같은 이름의 반복 작업이 있으면 BullMQ가 중복 생성하지 않는다. */
export async function scheduleSubscriptionCancellation(): Promise<void> {
  await subscriptionCancellationQueue.add(
    "downgrade-canceled",
    {},
    { repeat: { every: CHECK_INTERVAL_MS }, jobId: "subscription-cancellation-daily" },
  );
}
