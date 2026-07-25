import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  /** Provisions the default Free plan (19_PRD: "회원가입 → Free 시작"). */
  createDefault(userId: string): Promise<Subscription>;
  /** Mock upgrade path (no real PG integration yet) -- swap the caller for a real payment webhook later. */
  updatePlan(userId: string, planCode: PlanCode): Promise<Subscription>;
  /**
   * 선물 코드 등록처럼 "이 기간까지만" 유지되는 등급을 부여한다 --
   * updatePlan(관리자 직접 승격, 영구)과 달리 currentPeriodEnd를 채워서
   * giftCodeExpiryWorker가 만료 시점에 자동으로 free로 되돌릴 수 있게 한다.
   */
  grantTemporaryPlan(userId: string, planCode: PlanCode, periodStart: Date, periodEnd: Date): Promise<Subscription>;
  /**
   * currentPeriodEnd가 now를 지난(=일시적으로 부여된) 구독을 전부 free로
   * 되돌리고 period 필드를 비운다. 되돌린 행 수를 반환한다.
   */
  revertExpiredTemporaryPlans(now: Date): Promise<number>;
}
