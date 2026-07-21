import { prisma } from "@/shared/database/prisma";
import type {
  AdminUserSearchResult,
  AdminUserStatus,
  AuditLogEntry,
  CostBreakdownEntry,
  CostTrendPoint,
  ErrorRateEntry,
  PlanDistributionEntry,
  UsageTrendPoint,
} from "@/modules/admin/domain/Admin";
import type { AdminRepository, AuditLogFilter } from "@/modules/admin/domain/AdminRepository";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import type { AdminTier, UserRole } from "@/shared/auth/jwt";

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeRate(failed: number, total: number): number {
  return total === 0 ? 0 : Math.round((failed / total) * 1000) / 1000;
}

function statusFor(user: { suspendedAt: Date | null; deletedAt: Date | null }): AdminUserStatus {
  if (user.deletedAt) return "deleted";
  if (user.suspendedAt) return "suspended";
  return "active";
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

  async costBreakdownSince(since: Date): Promise<CostBreakdownEntry[]> {
    const rows = await prisma.usageLog.findMany({
      where: { createdAt: { gte: since }, costAmount: { not: null } },
      select: { eventType: true, costAmount: true, metadata: true },
    });

    // metadata.source가 없는 과거 로그(이 필드 추가 이전)는 eventType으로
    // 대체 집계된다 -- generation/edit/mockup이 전부 "image_generation"으로
    // 뭉뚱그려질 수 있음, 새 로그부터는 정확히 분리된다.
    const buckets = new Map<string, { totalCost: number; count: number }>();
    for (const row of rows) {
      const metadata = row.metadata as Record<string, unknown> | null;
      const source = typeof metadata?.source === "string" ? metadata.source : row.eventType;
      const bucket = buckets.get(source) ?? { totalCost: 0, count: 0 };
      bucket.totalCost += row.costAmount?.toNumber() ?? 0;
      bucket.count += 1;
      buckets.set(source, bucket);
    }

    return [...buckets.entries()]
      .map(([source, b]) => ({ source, totalCost: b.totalCost, count: b.count }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }

  async searchUsers(query: string, limit: number): Promise<AdminUserSearchResult[]> {
    // 삭제된 계정은 더 이상 관리할 대상이 아니므로 기본 검색에서 제외한다
    // (완전히 지우진 않고 소프트 삭제라 필요하면 DB에서 직접 확인 가능).
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(query ? { email: { contains: query, mode: "insensitive" } } : {}),
      },
      include: { subscription: true, _count: { select: { projects: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return this.toSearchResults(users);
  }

  async getUserById(id: string): Promise<AdminUserSearchResult | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true, _count: { select: { projects: true } } },
    });
    if (!user) return null;
    const [result] = await this.toSearchResults([user]);
    return result ?? null;
  }

  private async toSearchResults(
    users: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      adminTier: AdminTier | null;
      suspendedAt: Date | null;
      deletedAt: Date | null;
      lastLoginAt: Date | null;
      createdAt: Date;
      subscription: { planCode: string } | null;
      _count: { projects: number };
    }[],
  ): Promise<AdminUserSearchResult[]> {
    const userIds = users.map((u) => u.id);
    const generationCounts =
      userIds.length > 0
        ? await prisma.usageLog.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds }, eventType: GENERATION_EVENT_TYPE },
            _sum: { quantity: true },
          })
        : [];
    const countByUser = new Map(generationCounts.map((g) => [g.userId, g._sum.quantity ?? 0]));

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      adminTier: u.adminTier,
      status: statusFor(u),
      planCode: (u.subscription?.planCode ?? "free") as PlanCode,
      projectCount: u._count.projects,
      generationCount: countByUser.get(u.id) ?? 0,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }

  async suspendUser(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } });
  }

  async unsuspendUser(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { suspendedAt: null } });
  }

  async softDeleteUser(id: string): Promise<void> {
    // email과 마찬가지로 oauth_accounts도 (provider, providerAccountId)에
    // UNIQUE 제약이 걸려있다 -- 이 행을 지우지 않고 두면
    // findByProviderAccount()가 deletedAt 여부와 무관하게 이 탈퇴한 유저를
    // 계속 찾아내서, 같은 구글/카카오 계정으로 재가입을 시도할 때마다
    // OAuthLoginUseCase가 "삭제된 계정입니다"(AUTH-010)로 막아버린다(실
    // 사용자가 겪은 버그 -- 이메일만 익명화하고 이 링크는 놓쳤었다).
    // email에도 동일한 이유로 익명화가 필요하다 -- deletedAt만 세팅하고
    // email을 그대로 두면 findByEmail()이 이 행을 그대로 찾아버려서
    // RegisterUseCase는 "이미 사용 중"으로 막는다. .invalid는 RFC 2606이
    // "존재할 수 없는 도메인"으로 예약한 TLD라 실제 메일 발송/충돌
    // 위험이 없다.
    await prisma.$transaction([
      prisma.oAuthAccount.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), email: `deleted-${id}@deleted.aster.invalid` },
      }),
    ]);
  }

  async changeUserRole(id: string, role: UserRole, adminTier: AdminTier | null): Promise<void> {
    await prisma.user.update({ where: { id }, data: { role, adminTier } });
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
