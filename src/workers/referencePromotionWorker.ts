import { Worker } from "bullmq";
import { bullMqConnectionOptions } from "@/shared/queue/bullMqConnection";
import { REFERENCE_PROMOTION_QUEUE_NAME } from "@/shared/queue/referencePromotionQueue";
import type { PromoteGenerationsToReferenceUseCase } from "@/modules/promptPriority/application/PromoteGenerationsToReferenceUseCase";
import { logger } from "@/shared/logging/logger";

/**
 * 매일 자동으로 아직 평가 안 된 완료 생성물을 평가하고(비용 없는 행동
 * 신호 + 사용자 평가), 80점 이상만 참고 DB로 승격한다. AI 호출 없음.
 * 이미지 생성 워커와 동일하게 Use Case를 파라미터로 받아 container.ts와의
 * 순환 참조를 피한다.
 */
export function startReferencePromotionWorker(useCase: PromoteGenerationsToReferenceUseCase): Worker {
  const worker = new Worker(
    REFERENCE_PROMOTION_QUEUE_NAME,
    async () => {
      const result = await useCase.execute();
      logger.info("Reference promotion run completed", result);
      return result;
    },
    { connection: bullMqConnectionOptions, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    logger.error("Reference promotion worker job failed", {
      jobId: job?.id,
      details: err instanceof Error ? err.message : String(err),
    });
  });

  worker.on("error", (err) => {
    logger.error("Reference promotion worker connection error", {
      details: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
