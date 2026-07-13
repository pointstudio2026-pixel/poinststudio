import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { UsageRepository } from "@/modules/subscriptions/domain/UsageRepository";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS, type PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { getCurrentBillingPeriodStart } from "@/modules/subscriptions/domain/billingPeriod";
import type { UserRole } from "@/shared/auth/jwt";
import { AuthorizationError } from "@/shared/errors/AppError";

export interface UsageSummary {
  planCode: PlanCode;
  periodStart: Date;
  generation: { used: number; limit: number; remaining: number };
}

export class GetUsageSummaryUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly usageRepository: UsageRepository,
  ) {}

  /**
   * Self-service usage lookup, with an admin escape hatch ("관리자 사용량
   * 조회"): a `designer` may only ever see their own summary; `admin` may
   * pass `targetUserId` to inspect anyone's.
   */
  async execute(input: {
    requesterId: string;
    requesterRole: UserRole;
    targetUserId?: string;
  }): Promise<UsageSummary> {
    const targetUserId = input.targetUserId ?? input.requesterId;
    if (targetUserId !== input.requesterId && input.requesterRole !== "admin") {
      throw new AuthorizationError("다른 사용자의 사용량을 조회할 권한이 없습니다.");
    }

    const subscription =
      (await this.subscriptionRepository.findByUserId(targetUserId)) ??
      (await this.subscriptionRepository.createDefault(targetUserId));

    const periodStart = getCurrentBillingPeriodStart();
    const limit = PLAN_LIMITS[subscription.planCode].monthlyGenerationLimit;
    const used = await this.usageRepository.countSince(
      targetUserId,
      GENERATION_EVENT_TYPE,
      periodStart,
    );

    return {
      planCode: subscription.planCode,
      periodStart,
      generation: { used, limit, remaining: Math.max(0, limit - used) },
    };
  }
}
