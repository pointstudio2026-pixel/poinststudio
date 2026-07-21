import type {
  AdminUserSearchResult,
  AuditLogEntry,
  CostBreakdownEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  SystemAnnouncement,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";
import type { AdminRepository, AuditLogFilter } from "@/modules/admin/domain/AdminRepository";
import type { AnnouncementRepository } from "@/modules/admin/domain/AnnouncementRepository";
import type { QueueInspectable } from "@/modules/admin/domain/QueueInspectable";
import type { AdminTier, UserRole } from "@/shared/auth/jwt";

export class FakeAdminRepository implements AdminRepository {
  dailyActiveUsers = 0;
  newProjects = 0;
  plans: PlanDistributionEntry[] = [];
  errors: ErrorRateEntry[] = [];
  trend: UsageTrendPoint[] = [];
  costs: CostTrendPoint[] = [];
  totalCost = 0;
  costBreakdown: CostBreakdownEntry[] = [];
  users: AdminUserSearchResult[] = [];
  auditLogs: AuditLogEntry[] = [];
  lastAuditLogFilter: AuditLogFilter | null = null;

  async countDailyActiveUsers(): Promise<number> {
    return this.dailyActiveUsers;
  }
  async countNewProjectsSince(): Promise<number> {
    return this.newProjects;
  }
  async planDistribution(): Promise<PlanDistributionEntry[]> {
    return this.plans;
  }
  async errorRates(): Promise<ErrorRateEntry[]> {
    return this.errors;
  }
  async usageTrend(): Promise<UsageTrendPoint[]> {
    return this.trend;
  }
  async costTrend(): Promise<CostTrendPoint[]> {
    return this.costs;
  }
  async totalCostSince(): Promise<number> {
    return this.totalCost;
  }
  async costBreakdownSince(): Promise<CostBreakdownEntry[]> {
    return this.costBreakdown;
  }
  async searchUsers(query: string): Promise<AdminUserSearchResult[]> {
    const active = this.users.filter((u) => u.status !== "deleted");
    return query ? active.filter((u) => u.email.includes(query)) : active;
  }
  async getUserById(id: string): Promise<AdminUserSearchResult | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async listAuditLogs(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    this.lastAuditLogFilter = filter;
    return this.auditLogs;
  }
  async suspendUser(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.status = "suspended";
  }
  async unsuspendUser(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.status = "active";
  }
  async softDeleteUser(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.status = "deleted";
  }
  async changeUserRole(id: string, role: UserRole, adminTier: AdminTier | null): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      user.adminTier = adminTier;
    }
  }
}

export class FakeAnnouncementRepository implements AnnouncementRepository {
  announcements: SystemAnnouncement[] = [];
  private nextId = 1;

  async create(message: string, createdBy: string): Promise<SystemAnnouncement> {
    const announcement: SystemAnnouncement = {
      id: `announcement-${this.nextId++}`,
      message,
      active: true,
      createdBy,
      createdAt: new Date(),
      deactivatedAt: null,
    };
    this.announcements.push(announcement);
    return announcement;
  }

  async listActive(): Promise<SystemAnnouncement[]> {
    return this.announcements.filter((a) => a.active);
  }

  async deactivate(id: string): Promise<SystemAnnouncement> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("announcement not found");
    this.announcements[index] = { ...this.announcements[index]!, active: false, deactivatedAt: new Date() };
    return this.announcements[index]!;
  }
}

export class FakeQueue implements QueueInspectable {
  counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

  async getJobCounts() {
    return this.counts;
  }
}
