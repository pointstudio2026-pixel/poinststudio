import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";

/**
 * RevertExpiredGiftPlansUseCase와 같은 모양의 워커 Use Case이지만 트리거
 * 조건이 다르다 -- gift 워커는 currentPeriodEnd가 있는 구독을 "무조건"
 * 되돌리고(선물이라 갱신 개념이 없음), 이건 cancelAtPeriodEnd로 취소를
 * 명시적으로 예약해둔 구독만 대상으로 한다(실제 PG 붙으면 취소 안 한
 * 구독은 이 시점에 갱신 결제가 일어나야지 free로 내려가면 안 됨). AI 호출
 * 없음.
 */
export class DowngradeCanceledSubscriptionsUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(): Promise<{ downgraded: number }> {
    const downgraded = await this.subscriptionRepository.downgradeCanceledSubscriptions(new Date());
    return { downgraded };
  }
}
