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

export interface AdminAnalyticsDto {
  usageTrend: { date: string; count: number }[];
  costTrend: { date: string; costAmount: number }[];
  planDistribution: PlanDistributionEntryDto[];
  totalCostThisMonth: number;
}

export interface AdminUserSearchResultDto {
  id: string;
  email: string;
  role: "designer" | "admin";
  planCode: "free" | "pro" | "studio";
  projectCount: number;
  createdAt: string;
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
