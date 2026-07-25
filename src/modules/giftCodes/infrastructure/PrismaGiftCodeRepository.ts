import { prisma } from "@/shared/database/prisma";
import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type {
  CreateGiftCodeInput,
  GiftCodeRepository,
} from "@/modules/giftCodes/domain/GiftCodeRepository";

export class PrismaGiftCodeRepository implements GiftCodeRepository {
  async createMany(inputs: CreateGiftCodeInput[]): Promise<GiftCode[]> {
    await prisma.giftCode.createMany({
      data: inputs.map((input) => ({
        code: input.code,
        planCode: input.planCode,
        grantDays: input.grantDays,
        batchLabel: input.batchLabel,
        expiresAt: input.expiresAt,
        createdByUserId: input.createdByUserId,
      })),
    });
    const codes = inputs.map((i) => i.code);
    return prisma.giftCode.findMany({ where: { code: { in: codes } }, orderBy: { createdAt: "asc" } });
  }

  async findByCode(code: string): Promise<GiftCode | null> {
    return prisma.giftCode.findUnique({ where: { code } });
  }

  async markRedeemed(id: string, userId: string, redeemedAt: Date): Promise<GiftCode> {
    return prisma.giftCode.update({
      where: { id },
      data: { redeemedByUserId: userId, redeemedAt },
    });
  }

  async list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]> {
    return prisma.giftCode.findMany({
      where: input?.batchLabel ? { batchLabel: input.batchLabel } : undefined,
      orderBy: { createdAt: "desc" },
      take: input?.limit ?? 200,
    });
  }
}
