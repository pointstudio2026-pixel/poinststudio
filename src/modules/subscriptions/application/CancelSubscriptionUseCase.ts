import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import { ValidationError } from "@/shared/errors/AppError";

/**
 * 셀프서비스 구독 취소 예약 -- 본인 구독만 대상이라 UpgradePlanUseCase(admin
 * 전용, 타인 대상)와 달리 targetUserId/actingUserId 구분이 없다. 즉시
 * free로 내리지 않고 cancelAtPeriodEnd만 세운다 -- currentPeriodEnd까지는
 * 그대로 이용하다가 downgradeCanceledSubscriptions 워커가 만료 시점에
 * 실제로 내린다. 아직 실제 PG 연동 전이라 currentPeriodEnd가 없는(=admin이
 * 영구로 올려준) 구독에 대해서는 예약만 될 뿐 실제로 내려가는 시점이 없다.
 */
export class CancelSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: { userId: string }): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByUserId(input.userId);
    if (!subscription || subscription.planCode === "free") {
      throw new ValidationError("취소할 구독이 없습니다.");
    }
    if (subscription.cancelAtPeriodEnd) {
      throw new ValidationError("이미 취소가 예약된 구독입니다.");
    }
    return this.subscriptionRepository.scheduleCancelAtPeriodEnd(input.userId);
  }
}
