import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  RecordUsageInput,
  UsageRepository,
} from "@/modules/subscriptions/domain/UsageRepository";

export class PrismaUsageRepository implements UsageRepository {
  async record(input: RecordUsageInput): Promise<void> {
    await prisma.usageLog.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        eventType: input.eventType,
        quantity: input.quantity ?? 1,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency ?? "USD",
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async countSince(userId: string, eventType: string, since: Date): Promise<number> {
    const result = await prisma.usageLog.aggregate({
      where: { userId, eventType, createdAt: { gte: since } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
