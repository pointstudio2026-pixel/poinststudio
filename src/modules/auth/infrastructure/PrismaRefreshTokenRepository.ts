import { prisma } from "@/shared/database/prisma";
import type {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "@/modules/auth/domain/RefreshTokenRepository";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    return prisma.refreshToken.create({ data: input });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeById(id: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotate(input: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
  }): Promise<RefreshTokenRecord | null> {
    return prisma.$transaction(async (tx) => {
      const newRecord = await tx.refreshToken.create({ data: input.newToken });

      const claim = await tx.refreshToken.updateMany({
        where: { id: input.oldTokenId, revokedAt: null },
        data: { revokedAt: new Date(), replacedByTokenId: newRecord.id },
      });

      if (claim.count === 0) {
        // Lost the race to a concurrent rotation; roll back by throwing.
        throw new RaceLostError();
      }

      return newRecord;
    }).catch((err) => {
      if (err instanceof RaceLostError) return null;
      throw err;
    });
  }
}

class RaceLostError extends Error {}
