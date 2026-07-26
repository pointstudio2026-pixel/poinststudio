import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface GiftCode {
  id: string;
  code: string;
  planCode: PlanCode;
  grantDays: number;
  batchLabel: string | null;
  expiresAt: Date | null;
  /** 1이면 기존처럼 1인 전용, 2 이상이면 여러 명이 같은 코드를 나눠 쓸 수 있다. */
  maxRedemptions: number;
  /** 지금까지 실제로 사용된 인원 수. */
  redemptionCount: number;
  /** 하위 호환/빠른 조회용(첫 사용자) -- 실제 사용 인원 판정은 redemptionCount 기준. */
  redeemedByUserId: string | null;
  redeemedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
}
