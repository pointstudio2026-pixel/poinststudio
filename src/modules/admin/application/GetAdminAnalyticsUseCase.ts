import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import type { AdminAnalytics } from "@/modules/admin/domain/Admin";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";

const TREND_DAYS = 14;

export class GetAdminAnalyticsUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(): Promise<AdminAnalytics> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [usageTrend, costTrend, planDistribution, totalCostThisMonth] = await Promise.all([
      this.adminRepository.usageTrend(GENERATION_EVENT_TYPE, TREND_DAYS),
      this.adminRepository.costTrend(TREND_DAYS),
      this.adminRepository.planDistribution(),
      this.adminRepository.totalCostSince(startOfMonth),
    ]);

    return { usageTrend, costTrend, planDistribution, totalCostThisMonth };
  }
}
