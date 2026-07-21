import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import type { AdminTier, UserRole } from "@/shared/auth/jwt";

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

/**
 * source: "generation"|"edit"|"mockup" (from usage_logs.metadata.source,
 * ProcessGenerationJobUseCase 등에서 기록) -- 이 필드를 추가하기 전에 쌓인
 * 과거 로그는 source가 없어 eventType("image_generation")으로 대체 집계됨.
 * 텍스트 생성(GPT 브랜드 전략/인터뷰/추천 등) 비용은 아직 추적되지 않으므로
 * 이 목록에 없다 -- 실제 OpenAI 청구액은 이 합계보다 클 수 있다.
 */
export interface CostBreakdownEntry {
  source: string;
  totalCost: number;
  count: number;
}

export interface AdminAnalytics {
  usageTrend: UsageTrendPoint[];
  costTrend: CostTrendPoint[];
  costBreakdown: CostBreakdownEntry[];
  planDistribution: PlanDistributionEntry[];
  totalCostThisMonth: number;
}

export type AdminUserStatus = "active" | "suspended" | "deleted";

export interface AdminUserSearchResult {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  adminTier: AdminTier | null;
  status: AdminUserStatus;
  planCode: PlanCode;
  projectCount: number;
  generationCount: number;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AdminUserDetail {
  profile: AdminUserSearchResult;
  recentActivity: AuditLogEntry[];
  usage: {
    planCode: PlanCode;
    generation: { used: number; limit: number; remaining: number };
  };
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
