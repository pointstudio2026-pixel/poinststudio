import { Queue } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { logger } from "@/shared/logging/logger";

export const GIFT_CODE_EXPIRY_QUEUE_NAME = "gift-code-expiry";

// 만료 시점을 정확히 초 단위로 지킬 이유가 없다 -- 결제 연동 없는 프로모션
// 등급이라 하루 정도 늦게 내려가도 실질적 피해가 없고, 하루 주기가 다른
// 자동 워커(referencePromotionQueue)와 같은 결이라 운영 부담도 적다.
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const globalForQueue = globalThis as unknown as { giftCodeExpiryQueue?: Queue };

export const giftCodeExpiryQueue =
  globalForQueue.giftCodeExpiryQueue ??
  new Queue(GIFT_CODE_EXPIRY_QUEUE_NAME, {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 20 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.giftCodeExpiryQueue = giftCodeExpiryQueue;
}

giftCodeExpiryQueue.on("error", (err) => {
  logger.error("Gift code expiry queue connection error", {
    details: err instanceof Error ? err.message : String(err),
  });
});

/** 반복 작업 등록(멱등) -- 이미 같은 이름의 반복 작업이 있으면 BullMQ가 중복 생성하지 않는다. */
export async function scheduleGiftCodeExpiry(): Promise<void> {
  await giftCodeExpiryQueue.add(
    "revert-expired",
    {},
    { repeat: { every: CHECK_INTERVAL_MS }, jobId: "gift-code-expiry-daily" },
  );
}
