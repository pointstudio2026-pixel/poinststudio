import { Worker } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { SUBSCRIPTION_CANCELLATION_QUEUE_NAME } from "@/shared/queue/subscriptionCancellationQueue";
import type { DowngradeCanceledSubscriptionsUseCase } from "@/modules/subscriptions/application/DowngradeCanceledSubscriptionsUseCase";
import { logger } from "@/shared/logging/logger";

/**
 * 매일 자동으로, 취소 예약된(cancelAtPeriodEnd) 구독 중 결제 기간이 끝난
 * 것을 free로 되돌린다. AI 호출 없음. giftCodeExpiryWorker와 동일한 구조.
 * 실제 PG 연동 전까지는 cancelAtPeriodEnd를 세우는 진입점이 없어 매번
 * downgraded: 0으로 끝난다 -- 실제 결제 붙을 때 바로 쓸 수 있도록 미리
 * 준비해둔 워커다.
 */
export function startSubscriptionCancellationWorker(useCase: DowngradeCanceledSubscriptionsUseCase): Worker {
  const worker = new Worker(
    SUBSCRIPTION_CANCELLATION_QUEUE_NAME,
    async () => {
      const result = await useCase.execute();
      logger.info("Subscription cancellation run completed", result);
      return result;
    },
    { connection: bullMqConnectionOptions, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Subscription cancellation worker job failed", {
      jobId: job?.id,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  worker.on("error", (err) => {
    logger.error("Subscription cancellation worker connection error", {
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
