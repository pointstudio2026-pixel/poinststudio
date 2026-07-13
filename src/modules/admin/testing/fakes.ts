import type {
  AdminUserSearchResult,
  AuditLogEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  SystemAnnouncement,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";
import type { AdminRepository, AuditLogFilter } from "@/modules/admin/domain/AdminRepository";
import type { AnnouncementRepository } from "@/modules/admin/domain/AnnouncementRepository";
import type { QueueInspectable } from "@/modules/admin/domain/QueueInspectable";

export class FakeAdminRepository implements AdminRepository {
  dailyActiveUsers = 0;
  newProjects = 0;
  plans: PlanDistributionEntry[] = [];
  errors: ErrorRateEntry[] = [];
  trend: UsageTrendPoint[] = [];
  costs: CostTrendPoint[] = [];
  totalCost = 0;
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
  async searchUsers(query: string): Promise<AdminUserSearchResult[]> {
    return query ? this.users.filter((u) => u.email.includes(query)) : this.users;
  }
  async listAuditLogs(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    this.lastAuditLogFilter = filter;
    return this.auditLogs;
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
