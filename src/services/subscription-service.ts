import { apiFetch } from "@/services/http-client";

export interface SubscriptionDto {
  planCode: "free" | "pro" | "studio";
  status: string;
}

export interface UsageSummaryDto {
  planCode: "free" | "pro" | "studio";
  periodStart: string;
  generation: { used: number; limit: number; remaining: number };
}

export interface PlanDto {
  planCode: "free" | "pro" | "studio";
  monthlyGenerationLimit: number;
  maxResolution: "standard" | "high";
  priorityQueue: boolean;
}

export function fetchSubscription() {
  return apiFetch<{ subscription: SubscriptionDto }>("/api/subscription");
}

export function fetchUsageSummary() {
  return apiFetch<UsageSummaryDto>("/api/subscription/usage");
}

export function fetchPlans() {
  return apiFetch<{ plans: PlanDto[] }>("/api/subscription/plans");
}
