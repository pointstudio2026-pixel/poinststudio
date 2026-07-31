import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import { SYSTEM_GUEST_USER_ID } from "@/modules/mockups/domain/guestMockup";
import type {
  ClaimGuestMockupsResult,
  GuestMockupUsageRepository,
  RecordGuestMockupUsageInput,
} from "@/modules/mockups/domain/GuestMockupUsageRepository";

export class PrismaGuestMockupUsageRepository implements GuestMockupUsageRepository {
  async countByGuestId(guestId: string): Promise<number> {
    return prisma.guestMockupUsage.count({ where: { guestId } });
  }

  async create(input: RecordGuestMockupUsageInput): Promise<void> {
    await prisma.guestMockupUsage.create({
      data: {
        guestId: input.guestId,
        projectId: input.projectId,
        standaloneMockupId: input.standaloneMockupId,
        requestIp: input.requestIp ?? null,
      },
    });
  }

  async claimAllForGuest(guestId: string, userId: string): Promise<ClaimGuestMockupsResult> {
    return prisma.$transaction(
      async (tx) => {
        const rows = await tx.guestMockupUsage.findMany({
          where: { guestId, claimedAt: null },
          select: { id: true, projectId: true, standaloneMockupId: true },
        });
        if (rows.length === 0) return { claimedCount: 0 };

        const claimed = await tx.guestMockupUsage.updateMany({
          where: { id: { in: rows.map((r) => r.id) }, claimedAt: null },
          data: { claimedAt: new Date(), claimedByUserId: userId },
        });

        await tx.project.updateMany({
          where: { id: { in: rows.map((r) => r.projectId) }, userId: SYSTEM_GUEST_USER_ID },
          data: { userId },
        });
        await tx.standaloneMockup.updateMany({
          where: { id: { in: rows.map((r) => r.standaloneMockupId) }, userId: SYSTEM_GUEST_USER_ID },
          data: { userId },
        });

        return { claimedCount: claimed.count };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
