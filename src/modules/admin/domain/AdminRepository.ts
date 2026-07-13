import type {
  AdminUserSearchResult,
  AuditLogEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";

export interface AuditLogFilter {
  userId?: string;
  eventType?: string;
  projectId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

/**
 * Read-only aggregation queries for the Admin Dashboard -- like
 * DesignMemorySignalsRepository, these span across users/projects rather
 * than being scoped to one, which is the whole point of an admin view.
 */
export interface AdminRepository {
  countDailyActiveUsers(since: Date): Promise<number>;
  countNewProjectsSince(since: Date): Promise<number>;
  planDistribution(): Promise<PlanDistributionEntry[]>;
  errorRates(since: Date): Promise<ErrorRateEntry[]>;
  usageTrend(eventType: string, days: number): Promise<UsageTrendPoint[]>;
  costTrend(days: number): Promise<CostTrendPoint[]>;
  totalCostSince(since: Date): Promise<number>;
  searchUsers(query: string, limit: number): Promise<AdminUserSearchResult[]>;
  listAuditLogs(filter: AuditLogFilter): Promise<AuditLogEntry[]>;
}
