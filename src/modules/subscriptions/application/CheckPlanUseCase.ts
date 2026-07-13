import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { UsageRepository } from "@/modules/subscriptions/domain/UsageRepository";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS, type PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { getCurrentBillingPeriodStart } from "@/modules/subscriptions/domain/billingPeriod";

export interface CheckPlanOutput {
  allowed: boolean;
  planCode: PlanCode;
  used: number;
  limit: number;
}

export class CheckPlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly usageRepository: UsageRepository,
  ) {}

  async execute(input: { userId: string; eventType: string }): Promise<CheckPlanOutput> {
    const subscription =
      (await this.subscriptionRepository.findByUserId(input.userId)) ??
      (await this.subscriptionRepository.createDefault(input.userId));

    if (input.eventType !== GENERATION_EVENT_TYPE) {
      // Only image generation has a defined limit so far (Task-013/014/016/019
      // will register their own limits when they're built).
      return {
        allowed: true,
        planCode: subscription.planCode,
        used: 0,
        limit: Number.POSITIVE_INFINITY,
      };
    }

    const limit = PLAN_LIMITS[subscription.planCode].monthlyGenerationLimit;
    const periodStart = getCurrentBillingPeriodStart();
    const used = await this.usageRepository.countSince(
      input.userId,
      GENERATION_EVENT_TYPE,
      periodStart,
    );

    return { allowed: used < limit, planCode: subscription.planCode, used, limit };
  }
}
