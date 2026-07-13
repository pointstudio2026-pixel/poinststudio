import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";

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
}
