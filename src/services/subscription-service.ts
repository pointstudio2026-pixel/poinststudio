import { apiFetch } from "@/services/http-client";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface SubscriptionDto {
  id: string;
  userId: string;
  planCode: PlanCode;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export function upgradePlan(planCode: PlanCode) {
  return apiFetch<{ subscription: SubscriptionDto; previousPlanCode: PlanCode }>("/api/subscription/upgrade", {
    method: "POST",
    body: JSON.stringify({ planCode }),
  });
}
