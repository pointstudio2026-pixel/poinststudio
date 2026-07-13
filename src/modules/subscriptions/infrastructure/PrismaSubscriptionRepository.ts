import { prisma } from "@/shared/database/prisma";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { userId } });
  }

  async createDefault(userId: string): Promise<Subscription> {
    return prisma.subscription.upsert({
      where: { userId },
      create: { userId, planCode: "free", status: "active" },
      update: {},
    });
  }
}
