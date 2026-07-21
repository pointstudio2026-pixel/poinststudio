import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  /** Provisions the default Free plan (19_PRD: "회원가입 → Free 시작"). */
  createDefault(userId: string): Promise<Subscription>;
  /** Mock upgrade path (no real PG integration yet) -- swap the caller for a real payment webhook later. */
  updatePlan(userId: string, planCode: PlanCode): Promise<Subscription>;
}
