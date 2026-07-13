import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";

export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: { userId: string }): Promise<Subscription> {
    const existing = await this.subscriptionRepository.findByUserId(input.userId);
    if (existing) return existing;
    // Defensive fallback: every registered user gets one at sign-up
    // (RegisterUseCase), but never leave a user without a plan.
    return this.subscriptionRepository.createDefault(input.userId);
  }
}
