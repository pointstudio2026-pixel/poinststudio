import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { userId } });
  }

  async createDefault(userId: string): Promise<Subscription> {
    try {
      return await prisma.subscription.upsert({
        where: { userId },
        create: { userId, planCode: "free", status: "active" },
        update: {},
      });
    } catch (err) {
      // Two concurrent first-time reads (e.g. GetDashboardUseCase fetching
      // subscription + usage in parallel) can both race to provision the
      // same user's row. Whichever loses just reads what the winner wrote.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const existing = await prisma.subscription.findUnique({ where: { userId } });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async updatePlan(userId: string, planCode: PlanCode): Promise<Subscription> {
    return prisma.subscription.update({ where: { userId }, data: { planCode } });
  }

  async grantTemporaryPlan(
    userId: string,
    planCode: PlanCode,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Subscription> {
    return prisma.subscription.update({
      where: { userId },
      data: { planCode, status: "active", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd },
    });
  }

  async revertExpiredTemporaryPlans(now: Date): Promise<number> {
    const result = await prisma.subscription.updateMany({
      where: { currentPeriodEnd: { lt: now }, planCode: { not: "free" } },
      data: { planCode: "free", currentPeriodStart: null, currentPeriodEnd: null },
    });
    return result.count;
  }

  async scheduleCancelAtPeriodEnd(userId: string): Promise<Subscription> {
    return prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
  }

  async resumeSubscription(userId: string): Promise<Subscription> {
    return prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: false } });
  }

  async downgradeCanceledSubscriptions(now: Date): Promise<number> {
    const result = await prisma.subscription.updateMany({
      where: { cancelAtPeriodEnd: true, currentPeriodEnd: { lt: now } },
      data: { planCode: "free", currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    });
    return result.count;
  }
}
