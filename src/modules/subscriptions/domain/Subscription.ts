import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface Subscription {
  id: string;
  userId: string;
  planCode: PlanCode;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}
