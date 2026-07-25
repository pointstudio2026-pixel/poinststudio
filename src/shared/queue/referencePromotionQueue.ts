import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { logger } from "@/shared/logging/logger";

export const REFERENCE_PROMOTION_QUEUE_NAME = "reference-promotion";

// 사용자가 생성 결과에 좋아요/아쉬워요 평가를 남길 시간을 준 다음
// 채점하는 게 즉시 처리보다 합리적이다(평가가 없으면 어차피 저장 안
// 되므로 조급하게 돌릴 이유가 없음) -- 하루 주기가 합리적인 타협점.
const PROMOTION_INTERVAL_MS = 24 * 60 * 60 * 1000;

const globalForQueue = globalThis as unknown as { referencePromotionQueue?: Queue };

export const referencePromotionQueue =
  globalForQueue.referencePromotionQueue ??
  new Queue(REFERENCE_PROMOTION_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 20 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.referencePromotionQueue = referencePromotionQueue;
}

referencePromotionQueue.on("error", (err) => {
  logger.error("Reference promotion queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

/** 반복 작업 등록(멱등) -- 이미 같은 이름의 반복 작업이 있으면 BullMQ가 중복 생성하지 않는다. */
export async function scheduleReferencePromotion(): Promise<void> {
  await referencePromotionQueue.add(
    "promote",
    {},
    { repeat: { every: PROMOTION_INTERVAL_MS }, jobId: "reference-promotion-daily" },
  );
}
