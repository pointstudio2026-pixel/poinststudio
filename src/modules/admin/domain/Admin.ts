import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface PlanDistributionEntry {
  planCode: PlanCode;
  userCount: number;
}

export interface ProviderHealthStatus {
  provider: "text_completion" | "image_generation" | "mockup_render";
  name: string;
  healthy: boolean;
}

export interface QueueStatusEntry {
  queue: "image_generation" | "image_edit" | "mockup_render" | "export";
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface ErrorRateEntry {
  jobType: "generation" | "edit" | "mockup" | "export";
  total: number;
  failed: number;
  errorRate: number;
}

export interface AdminDashboardSummary {
  dailyActiveUsers: number;
  newProjectsToday: number;
  planDistribution: PlanDistributionEntry[];
  providerHealth: ProviderHealthStatus[];
  queueStatus: QueueStatusEntry[];
  errorRates: ErrorRateEntry[];
}

export interface UsageTrendPoint {
  date: string;
  count: number;
}

export interface CostTrendPoint {
  date: string;
  costAmount: number;
}

export interface AdminAnalytics {
  usageTrend: UsageTrendPoint[];
  costTrend: CostTrendPoint[];
  planDistribution: PlanDistributionEntry[];
  totalCostThisMonth: number;
}

export interface AdminUserSearchResult {
  id: string;
  email: string;
  role: "designer" | "admin";
  planCode: PlanCode;
  projectCount: number;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  projectId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface SystemAnnouncement {
  id: string;
  message: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  deactivatedAt: Date | null;
}
