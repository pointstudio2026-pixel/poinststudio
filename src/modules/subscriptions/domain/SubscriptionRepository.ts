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
  /** 본인 구독을 "이번 결제 기간이 끝나면 취소"로 예약한다(즉시 다운그레이드 아님). */
  scheduleCancelAtPeriodEnd(userId: string): Promise<Subscription>;
  /** 예약된 취소를 취소 시점 전에 되돌린다(계속 이용). */
  resumeSubscription(userId: string): Promise<Subscription>;
  /**
   * cancelAtPeriodEnd가 true이면서 currentPeriodEnd가 now를 지난 구독을
   * free로 전환하고 관련 필드를 비운다(gift 만료 워커와 같은 모양이지만,
   * 트리거 조건이 "무조건"이 아니라 "취소 예약된 경우만"이라는 점이 다르다).
   * 되돌린 행 수를 반환한다.
   */
  downgradeCanceledSubscriptions(now: Date): Promise<number>;
}
