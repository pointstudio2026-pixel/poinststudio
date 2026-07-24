import { apiFetch } from "@/services/http-client";

export interface PlanDistributionEntryDto {
  planCode: "free" | "pro" | "studio";
  userCount: number;
}

export interface ProviderHealthStatusDto {
  provider: "text_completion" | "image_generation" | "mockup_render";
  name: string;
  healthy: boolean;
}

export interface QueueStatusEntryDto {
  queue: "image_generation" | "image_edit" | "mockup_render" | "export";
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface ErrorRateEntryDto {
  jobType: "generation" | "edit" | "mockup" | "export";
  total: number;
  failed: number;
  errorRate: number;
}

export interface AdminDashboardSummaryDto {
  dailyActiveUsers: number;
  newProjectsToday: number;
  planDistribution: PlanDistributionEntryDto[];
  providerHealth: ProviderHealthStatusDto[];
  queueStatus: QueueStatusEntryDto[];
  errorRates: ErrorRateEntryDto[];
}

export interface CostBreakdownEntryDto {
  source: string;
  totalCost: number;
  count: number;
}

export interface AdminAnalyticsDto {
  usageTrend: { date: string; count: number }[];
  costTrend: { date: string; costAmount: number }[];
  costBreakdown: CostBreakdownEntryDto[];
  planDistribution: PlanDistributionEntryDto[];
  totalCostThisMonth: number;
}

export type AdminTierDto = "super_admin" | "manager" | "support";
export type AdminUserStatusDto = "active" | "suspended" | "deleted";

export interface AdminUserSearchResultDto {
  id: string;
  email: string;
  name: string | null;
  role: "designer" | "admin";
  adminTier: AdminTierDto | null;
  status: AdminUserStatusDto;
  planCode: "free" | "pro" | "studio";
  projectCount: number;
  generationCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUserDetailDto {
  profile: AdminUserSearchResultDto;
  recentActivity: AuditLogEntryDto[];
  usage: {
    planCode: "free" | "pro" | "studio";
    generation: { used: number; limit: number; remaining: number };
  };
}

export interface AuditLogEntryDto {
  id: string;
  userId: string | null;
  projectId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  message: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  deactivatedAt: string | null;
}

export function fetchAdminDashboard() {
  return apiFetch<{ summary: AdminDashboardSummaryDto }>("/api/admin/dashboard");
}

export function fetchAdminAnalytics() {
  return apiFetch<{ analytics: AdminAnalyticsDto }>("/api/admin/analytics");
}

export function searchAdminUsers(query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiFetch<{ users: AdminUserSearchResultDto[] }>(`/api/admin/users${qs}`);
}

export function fetchAuditLogs(filters: { eventType?: string; userId?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.userId) params.set("userId", filters.userId);
  const qs = params.toString();
  return apiFetch<{ logs: AuditLogEntryDto[] }>(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);
}

export function fetchAnnouncements() {
  return apiFetch<{ announcements: AnnouncementDto[] }>("/api/admin/announcements");
}

export function createAnnouncement(message: string) {
  return apiFetch<{ announcement: AnnouncementDto }>("/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function deactivateAnnouncement(id: string) {
  return apiFetch<{ announcement: AnnouncementDto }>(`/api/admin/announcements/${id}`, { method: "DELETE" });
}

export function fetchAdminUserDetail(userId: string) {
  return apiFetch<{ detail: AdminUserDetailDto }>(`/api/admin/users/${userId}`);
}

export function suspendUser(userId: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/users/${userId}/suspend`, { method: "POST" });
}

export function unsuspendUser(userId: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/users/${userId}/unsuspend`, { method: "POST" });
}

export function deleteAdminUser(userId: string) {
  return apiFetch<{ deleted: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" });
}

export function changeUserRole(userId: string, input: { role: "designer" | "admin"; adminTier?: AdminTierDto }) {
  return apiFetch<{ ok: boolean }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changeUserPlan(userId: string, planCode: "free" | "pro" | "studio") {
  return apiFetch<{ ok: boolean }>(`/api/admin/users/${userId}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ planCode }),
  });
}

export interface TrainingExampleDto {
  id: string;
  prompt: string;
  deliverableType: string;
  imageStorageKey: string | null;
  imageContentType: string | null;
  createdByUserId: string;
  createdAt: string;
  evaluationScore: number | null;
  evaluationBreakdown: Record<string, { score: number | null; reason?: string; note?: string }> | null;
  evaluatedAt: string | null;
  source: string;
  sourceGenerationVersionId: string | null;
  category: string;
  industry: string | null;
}

export function fetchTrainingExamples() {
  return apiFetch<{ examples: TrainingExampleDto[] }>("/api/admin/training-examples");
}

export function createTrainingExample(input: {
  prompt: string;
  deliverableType: string;
  image: File;
  category: string;
  industry?: string;
}) {
  const formData = new FormData();
  formData.set("prompt", input.prompt);
  formData.set("deliverableType", input.deliverableType);
  formData.set("image", input.image);
  formData.set("category", input.category);
  if (input.industry) formData.set("industry", input.industry);
  return apiFetch<{ example: TrainingExampleDto }>("/api/admin/training-examples", {
    method: "POST",
    body: formData,
  });
}

export function deleteTrainingExample(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/admin/training-examples/${id}`, { method: "DELETE" });
}

export function promoteGenerationsToReference() {
  return apiFetch<{ result: { evaluated: number; promoted: number } }>("/api/admin/training-examples/promote", {
    method: "POST",
  });
}

export interface PromptDecisionRecordDto {
  id: string;
  promptVersionId: string;
  hardConstraints: Record<string, unknown>;
  softPreferences: Record<string, unknown>;
  dbCandidatesFound: string[];
  dbCandidatesUsed: string[];
  conflicts: {
    category: string;
    field: string;
    userValue: string;
    discardedSuggestion: string;
    resolution: string;
    preservedGoalVia: string;
    sourceRef: string;
  }[];
  complianceCheck: { passed: boolean; issues: string[] };
  createdAt: string;
}

export function fetchPromptDecisionRecords() {
  return apiFetch<{ records: PromptDecisionRecordDto[] }>("/api/admin/prompt-decisions");
}
