import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface Subscription {
  id: string;
  userId: string;
  planCode: PlanCode;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  /**
   * true면 currentPeriodEnd까지는 지금 플랜을 그대로 쓰고, 그 시점이
   * 지나면 자동으로 free로 전환된다(실제 결제 갱신을 막는 대신 다운그레이드).
   * 실제 PG 연동 전까지는 이 필드를 세우는 진입점이 없어 항상 false다.
   */
  cancelAtPeriodEnd: boolean;
}
