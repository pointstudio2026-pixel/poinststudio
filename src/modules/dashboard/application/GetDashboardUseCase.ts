import type { ListProjectsUseCase } from "@/modules/projects/application/ListProjectsUseCase";
import type { Project } from "@/modules/projects/domain/Project";
import type { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type {
  GetUsageSummaryUseCase,
  UsageSummary,
} from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { getRecentActivity, type ActivityLogEntry } from "@/shared/activity/activityLogger";
import type { UserRole } from "@/shared/auth/jwt";

export interface DashboardOutput {
  projects: (Project & { isOwner: boolean })[];
  subscription: Subscription;
  usage: UsageSummary;
  recentActivity: ActivityLogEntry[];
}

/**
 * Aggregates the Dashboard's four independent reads into one round trip
 * (Task-005: "Dashboard는 빠른 로딩을 목표로 한다"), composing the already
 * -built Use Cases from the projects/subscriptions modules rather than
 * reaching into their repositories directly.
 */
export class GetDashboardUseCase {
  constructor(
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly getUsageSummaryUseCase: GetUsageSummaryUseCase,
  ) {}

  async execute(input: { userId: string; role: UserRole; search?: string }): Promise<DashboardOutput> {
    const [projects, subscription, usage, recentActivity] = await Promise.all([
      this.listProjectsUseCase.execute({ userId: input.userId, search: input.search }),
      this.getSubscriptionUseCase.execute({ userId: input.userId }),
      this.getUsageSummaryUseCase.execute({
        requesterId: input.userId,
        requesterRole: input.role,
      }),
      getRecentActivity(input.userId, 10),
    ]);

    return {
      projects: projects.map((p) => ({ ...p, isOwner: p.userId === input.userId })),
      subscription,
      usage,
      recentActivity,
    };
  }
}
