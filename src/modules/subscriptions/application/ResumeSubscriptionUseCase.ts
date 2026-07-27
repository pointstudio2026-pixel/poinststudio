import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import { ValidationError } from "@/shared/errors/AppError";

/** CancelSubscriptionUseCase로 예약해둔 취소를, 만료 전이면 되돌린다(계속 이용). */
export class ResumeSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: { userId: string }): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByUserId(input.userId);
    if (!subscription || !subscription.cancelAtPeriodEnd) {
      throw new ValidationError("예약된 취소가 없습니다.");
    }
    return this.subscriptionRepository.resumeSubscription(input.userId);
  }
}
