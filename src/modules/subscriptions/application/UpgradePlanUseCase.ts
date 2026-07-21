import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export interface UpgradePlanOutput {
  subscription: Subscription;
  previousPlanCode: PlanCode;
}

/**
 * 실제 PG 결제 연동 전까지 요금제 변경은 셀프서비스가 아니라 관리자 전용
 * 액션이다(일반 계정이 자기 플랜을 자유롭게 바꿀 수 있었던 이전 mock 동작을
 * 잠금 -- 라우트에서 requireAdminTier(["super_admin"])로 게이팅).
 * ChangeUserRoleUseCase와 동일한 패턴: 자기 자신 변경 방지 + 대상 존재 확인 +
 * 감사 로그.
 */
export class UpgradePlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly adminRepository: AdminRepository,
  ) {}

  async execute(input: { targetUserId: string; actingUserId: string; planCode: PlanCode }): Promise<UpgradePlanOutput> {
    if (input.targetUserId === input.actingUserId) {
      throw new ValidationError("자기 자신의 요금제는 변경할 수 없습니다.");
    }
    const target = await this.adminRepository.getUserById(input.targetUserId);
    if (!target) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    const previous =
      (await this.subscriptionRepository.findByUserId(input.targetUserId)) ??
      (await this.subscriptionRepository.createDefault(input.targetUserId));

    const subscription = await this.subscriptionRepository.updatePlan(input.targetUserId, input.planCode);

    await recordActivity({
      userId: input.actingUserId,
      eventType: "ADMIN_USER_PLAN_CHANGED",
      payload: { targetUserId: input.targetUserId, planCode: input.planCode },
    });

    return { subscription, previousPlanCode: previous.planCode };
  }
}
