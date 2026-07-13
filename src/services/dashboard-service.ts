import { apiFetch } from "@/services/http-client";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface DashboardProjectDto {
  id: string;
  name: string;
  status: string;
  currentStep: string;
  isFavorite: boolean;
  updatedAt: string;
}

export interface DashboardActivityDto {
  id: string;
  eventType: string;
  projectId: string | null;
  createdAt: string;
}

export interface DashboardDto {
  projects: DashboardProjectDto[];
  subscription: { planCode: PlanCode; status: string };
  usage: {
    planCode: PlanCode;
    periodStart: string;
    generation: { used: number; limit: number; remaining: number };
  };
  recentActivity: DashboardActivityDto[];
}

export function fetchDashboard(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<DashboardDto>(`/api/dashboard${query}`);
}
