import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/shared/database/prisma";
import { RedeemGiftCodeUseCase } from "@/modules/giftCodes/application/RedeemGiftCodeUseCase";
import { PrismaGiftCodeRepository } from "@/modules/giftCodes/infrastructure/PrismaGiftCodeRepository";
import { PrismaSubscriptionRepository } from "@/modules/subscriptions/infrastructure/PrismaSubscriptionRepository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";

const TEST_EMAIL_PREFIX = "gift-code-real-db-test";

afterEach(async () => {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  await prisma.giftCode.deleteMany({ where: { createdByUserId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

/**
 * GiftCode has two real FK constraints to User (createdByUserId,
 * redeemedByUserId) that FakeGiftCodeRepository doesn't enforce -- this
 * exercises the actual Prisma repositories against real Postgres so a bad
 * FK value (like the one PromoteGenerationsToReferenceUseCase had) would
 * fail here even if every unit test passes.
 */
describe("RedeemGiftCodeUseCase (real Prisma repositories, real Postgres)", () => {
  it("persists the redemption with valid FKs and a real subscription period", async () => {
    const userRepository = new PrismaUserRepository();
    const admin = await userRepository.create({
      email: `${TEST_EMAIL_PREFIX}-admin-${Date.now()}@aster.dev`,
      passwordHash: await new Argon2PasswordHasher().hash("password123"),
      emailVerifiedAt: new Date(),
    });
    const redeemer = await userRepository.create({
      email: `${TEST_EMAIL_PREFIX}-redeemer-${Date.now()}@aster.dev`,
      passwordHash: await new Argon2PasswordHasher().hash("password123"),
      emailVerifiedAt: new Date(),
    });

    const giftCodeRepository = new PrismaGiftCodeRepository();
    const shortSuffix = Date.now().toString(36).slice(-4).toUpperCase();
    const [giftCode] = await giftCodeRepository.createMany([
      {
        code: `ASTR-${shortSuffix}`,
        planCode: "pro",
        grantDays: 31,
        batchLabel: null,
        expiresAt: null,
        createdByUserId: admin.id,
      },
    ]);

    const subscriptionRepository = new PrismaSubscriptionRepository();
    const useCase = new RedeemGiftCodeUseCase(giftCodeRepository, subscriptionRepository);

    const result = await useCase.execute({ userId: redeemer.id, code: giftCode!.code });

    expect(result.planCode).toBe("pro");
    expect(result.currentPeriodEnd).not.toBeNull();

    const storedCode = await prisma.giftCode.findUnique({ where: { id: giftCode!.id } });
    expect(storedCode?.redeemedByUserId).toBe(redeemer.id);

    const storedSubscription = await prisma.subscription.findUnique({ where: { userId: redeemer.id } });
    expect(storedSubscription?.planCode).toBe("pro");
  });
});
