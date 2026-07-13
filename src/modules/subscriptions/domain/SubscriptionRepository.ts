import type { Subscription } from "@/modules/subscriptions/domain/Subscription";

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  /** Provisions the default Free plan (19_PRD: "회원가입 → Free 시작"). */
  createDefault(userId: string): Promise<Subscription>;
}
