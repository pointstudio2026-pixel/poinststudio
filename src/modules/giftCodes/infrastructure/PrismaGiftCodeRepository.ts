import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type {
  CreateGiftCodeInput,
  GiftCodeRepository,
} from "@/modules/giftCodes/domain/GiftCodeRepository";

const WITH_REDEMPTION_COUNT = {
  include: { _count: { select: { redemptions: true } } },
} as const;

type RowWithCount = Prisma.GiftCodeGetPayload<typeof WITH_REDEMPTION_COUNT>;

function toDomain(row: RowWithCount): GiftCode {
  const { _count, ...rest } = row;
  return { ...rest, redemptionCount: _count.redemptions };
}

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
        maxRedemptions: input.maxRedemptions ?? 1,
      })),
    });
    const codes = inputs.map((i) => i.code);
    const rows = await prisma.giftCode.findMany({
      where: { code: { in: codes } },
      orderBy: { createdAt: "asc" },
      ...WITH_REDEMPTION_COUNT,
    });
    return rows.map(toDomain);
  }

  async findByCode(code: string): Promise<GiftCode | null> {
    const row = await prisma.giftCode.findUnique({ where: { code }, ...WITH_REDEMPTION_COUNT });
    return row ? toDomain(row) : null;
  }

  async hasUserRedeemed(giftCodeId: string, userId: string): Promise<boolean> {
    const row = await prisma.giftCodeRedemption.findUnique({
      where: { giftCodeId_userId: { giftCodeId, userId } },
    });
    return row !== null;
  }

  async recordRedemption(giftCodeId: string, userId: string, redeemedAt: Date): Promise<GiftCode> {
    await prisma.giftCodeRedemption.create({ data: { giftCodeId, userId, redeemedAt } });
    // redeemedByUserId/redeemedAt는 하위 호환용 "첫 사용자" 스냅샷이라 처음 한 번만 채운다.
    await prisma.giftCode.updateMany({
      where: { id: giftCodeId, redeemedByUserId: null },
      data: { redeemedByUserId: userId, redeemedAt },
    });
    const row = await prisma.giftCode.findUniqueOrThrow({ where: { id: giftCodeId }, ...WITH_REDEMPTION_COUNT });
    return toDomain(row);
  }

  async list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]> {
    const rows = await prisma.giftCode.findMany({
      where: input?.batchLabel ? { batchLabel: input.batchLabel } : undefined,
      orderBy: { createdAt: "desc" },
      take: input?.limit ?? 200,
      ...WITH_REDEMPTION_COUNT,
    });
    return rows.map(toDomain);
  }
}
