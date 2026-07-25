import { Worker } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { GIFT_CODE_EXPIRY_QUEUE_NAME } from "@/shared/queue/giftCodeExpiryQueue";
import type { RevertExpiredGiftPlansUseCase } from "@/modules/subscriptions/application/RevertExpiredGiftPlansUseCase";
import { logger } from "@/shared/logging/logger";

/**
 * 매일 자동으로 선물 코드 등급의 만료 여부를 확인해 지난 구독을 free로
 * 되돌린다. AI 호출 없음. 이미지 생성 워커와 동일하게 Use Case를
 * 파라미터로 받아 container.ts와의 순환 참조를 피한다.
 */
export function startGiftCodeExpiryWorker(useCase: RevertExpiredGiftPlansUseCase): Worker {
  const worker = new Worker(
    GIFT_CODE_EXPIRY_QUEUE_NAME,
    async () => {
      const result = await useCase.execute();
      logger.info("Gift code expiry run completed", result);
      return result;
    },
    { connection: bullMqConnectionOptions, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Gift code expiry worker job failed", {
      jobId: job?.id,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  worker.on("error", (err) => {
    logger.error("Gift code expiry worker connection error", {
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
