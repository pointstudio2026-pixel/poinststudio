import { prisma } from "@/shared/database/prisma";
import type {
  AdminUserSearchResult,
  AuditLogEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";
import type { AdminRepository, AuditLogFilter } from "@/modules/admin/domain/AdminRepository";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeRate(failed: number, total: number): number {
  return total === 0 ? 0 : Math.round((failed / total) * 1000) / 1000;
}

export class PrismaAdminRepository implements AdminRepository {
  async countDailyActiveUsers(since: Date): Promise<number> {
    const rows = await prisma.activityLog.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    });
    return rows.length;
  }

  async countNewProjectsSince(since: Date): Promise<number> {
    return prisma.project.count({ where: { createdAt: { gte: since } } });
  }

  async planDistribution(): Promise<PlanDistributionEntry[]> {
    const rows = await prisma.subscription.groupBy({
      by: ["planCode"],
      _count: { planCode: true },
    });
    return rows.map((r) => ({ planCode: r.planCode as PlanCode, userCount: r._count.planCode }));
  }

  async errorRates(since: Date): Promise<ErrorRateEntry[]> {
    const [genTotal, genFailed, editTotal, editFailed, mockupTotal, mockupFailed, exportTotal, exportFailed] =
      await Promise.all([
        prisma.generationVersion.count({ where: { createdAt: { gte: since } } }),
        prisma.generationVersion.count({ where: { createdAt: { gte: since }, status: "failed" } }),
        prisma.editHistory.count({ where: { createdAt: { gte: since } } }),
        prisma.editHistory.count({ where: { createdAt: { gte: since }, status: "failed" } }),
        prisma.mockupProject.count({ where: { createdAt: { gte: since } } }),
        prisma.mockupProject.count({ where: { createdAt: { gte: since }, status: "failed" } }),
        prisma.exportJob.count({ where: { createdAt: { gte: since } } }),
        prisma.exportJob.count({ where: { createdAt: { gte: since }, status: "failed" } }),
      ]);

    return [
      { jobType: "generation", total: genTotal, failed: genFailed, errorRate: safeRate(genFailed, genTotal) },
      { jobType: "edit", total: editTotal, failed: editFailed, errorRate: safeRate(editFailed, editTotal) },
      { jobType: "mockup", total: mockupTotal, failed: mockupFailed, errorRate: safeRate(mockupFailed, mockupTotal) },
      { jobType: "export", total: exportTotal, failed: exportFailed, errorRate: safeRate(exportFailed, exportTotal) },
    ];
  }

  async usageTrend(eventType: string, days: number): Promise<UsageTrendPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.usageLog.findMany({
      where: { eventType, createdAt: { gte: since } },
      select: { createdAt: true, quantity: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(dateKey(d), 0);
    }
    for (const row of rows) {
      const key = dateKey(row.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + row.quantity);
    }
    return [...buckets.entries()].map(([date, count]) => ({ date, count }));
  }

  async costTrend(days: number): Promise<CostTrendPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.usageLog.findMany({
      where: { createdAt: { gte: since }, costAmount: { not: null } },
      select: { createdAt: true, costAmount: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(dateKey(d), 0);
    }
    for (const row of rows) {
      const key = dateKey(row.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + (row.costAmount?.toNumber() ?? 0));
    }
    return [...buckets.entries()].map(([date, costAmount]) => ({ date, costAmount }));
  }

  async totalCostSince(since: Date): Promise<number> {
    const result = await prisma.usageLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costAmount: true },
    });
    return result._sum.costAmount?.toNumber() ?? 0;
  }

  async searchUsers(query: string, limit: number): Promise<AdminUserSearchResult[]> {
    const users = await prisma.user.findMany({
      where: query ? { email: { contains: query, mode: "insensitive" } } : {},
      include: { subscription: true, _count: { select: { projects: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      planCode: (u.subscription?.planCode ?? "free") as PlanCode,
      projectCount: u._count.projects,
      createdAt: u.createdAt,
    }));
  }

  async listAuditLogs(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    const rows = await prisma.activityLog.findMany({
      where: {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.eventType ? { eventType: filter.eventType } : {}),
        ...(filter.projectId ? { projectId: filter.projectId } : {}),
        ...(filter.from || filter.to
          ? {
              createdAt: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
    });

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      projectId: r.projectId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      createdAt: r.createdAt,
    }));
  }
}
