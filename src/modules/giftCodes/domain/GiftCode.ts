import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface GiftCode {
  id: string;
  code: string;
  planCode: PlanCode;
  grantDays: number;
  batchLabel: string | null;
  expiresAt: Date | null;
  redeemedByUserId: string | null;
  redeemedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
}
