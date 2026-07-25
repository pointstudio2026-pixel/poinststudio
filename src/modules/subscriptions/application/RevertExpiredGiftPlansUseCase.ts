import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";

/**
 * 선물 코드로 부여된 일시적 등급(currentPeriodEnd가 채워진 구독)이 만료
 * 시점을 지나면 free로 되돌린다. 관리자가 UpgradePlanUseCase로 직접
 * 올려준 구독은 currentPeriodEnd가 null이라 이 워커의 영향을 받지 않는다
 * (2026-07-25, giftCodeExpiryWorker가 매일 자동 호출). AI 호출 없음.
 */
export class RevertExpiredGiftPlansUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(): Promise<{ reverted: number }> {
    const reverted = await this.subscriptionRepository.revertExpiredTemporaryPlans(new Date());
    return { reverted };
  }
}
