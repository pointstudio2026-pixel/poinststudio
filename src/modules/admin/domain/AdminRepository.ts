import type {
  AdminUserSearchResult,
  AuditLogEntry,
  CostBreakdownEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";
import type { AdminTier, UserRole } from "@/shared/auth/jwt";

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
  costBreakdownSince(since: Date): Promise<CostBreakdownEntry[]>;
  searchUsers(query: string, limit: number): Promise<AdminUserSearchResult[]>;
  getUserById(id: string): Promise<AdminUserSearchResult | null>;
  listAuditLogs(filter: AuditLogFilter): Promise<AuditLogEntry[]>;
  suspendUser(id: string): Promise<void>;
  unsuspendUser(id: string): Promise<void>;
  softDeleteUser(id: string): Promise<void>;
  changeUserRole(id: string, role: UserRole, adminTier: AdminTier | null): Promise<void>;
}
