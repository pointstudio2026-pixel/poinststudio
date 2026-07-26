import { describe, expect, it, vi } from "vitest";
import { RedeemGiftCodeUseCase } from "@/modules/giftCodes/application/RedeemGiftCodeUseCase";
import { FakeGiftCodeRepository } from "@/modules/giftCodes/testing/fakes";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";
import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function seedCode(repo: FakeGiftCodeRepository, overrides: Partial<GiftCode> = {}): GiftCode {
  const code: GiftCode = {
    id: "gift-code-1",
    code: "ASTER-TEST-CODE",
    planCode: "pro",
    grantDays: 31,
    batchLabel: null,
    expiresAt: null,
    maxRedemptions: 1,
    redemptionCount: 0,
    redeemedByUserId: null,
    redeemedAt: null,
    createdByUserId: "admin-1",
    createdAt: new Date(),
    ...overrides,
  };
  repo.codes.push(code);
  return code;
}

describe("RedeemGiftCodeUseCase", () => {
  it("upgrades a free user to the code's plan for grantDays", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    seedCode(giftCodes);
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    const result = await useCase.execute({ userId: "user-1", code: "aster-test-code" });

    expect(result.planCode).toBe("pro");
    expect(result.currentPeriodEnd).not.toBeNull();
    const daysGranted = Math.round(
      (result.currentPeriodEnd!.getTime() - result.currentPeriodStart!.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(daysGranted).toBe(31);
    expect(giftCodes.codes[0]?.redeemedByUserId).toBe("user-1");
    expect(giftCodes.codes[0]?.redemptionCount).toBe(1);
  });

  it("normalizes case and whitespace before lookup", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    seedCode(giftCodes, { code: "ASTER-ABCD-1234" });
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    const result = await useCase.execute({ userId: "user-1", code: "  aster-abcd-1234  " });

    expect(result.planCode).toBe("pro");
  });

  it("rejects an unknown code", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    await expect(useCase.execute({ userId: "user-1", code: "NOPE" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a single-use code that's already been redeemed by someone else", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    seedCode(giftCodes, { redeemedByUserId: "someone-else", redeemedAt: new Date(), redemptionCount: 1 });
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    await expect(useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a code past its registration deadline", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    seedCode(giftCodes, { expiresAt: new Date("2020-01-01") });
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    await expect(useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects a user who already has a paid plan", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "studio");
    seedCode(giftCodes);
    const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

    await expect(useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  describe("multi-use codes (maxRedemptions > 1)", () => {
    it("lets several different users redeem the same code up to the limit", async () => {
      const giftCodes = new FakeGiftCodeRepository();
      const subs = new FakeSubscriptionRepository();
      seedCode(giftCodes, { maxRedemptions: 3 });
      const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

      await useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" });
      await useCase.execute({ userId: "user-2", code: "ASTER-TEST-CODE" });
      const third = await useCase.execute({ userId: "user-3", code: "ASTER-TEST-CODE" });

      expect(third.planCode).toBe("pro");
      expect(giftCodes.codes[0]?.redemptionCount).toBe(3);
    });

    it("rejects once the redemption cap is reached", async () => {
      const giftCodes = new FakeGiftCodeRepository();
      const subs = new FakeSubscriptionRepository();
      seedCode(giftCodes, { maxRedemptions: 2 });
      const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

      await useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" });
      await useCase.execute({ userId: "user-2", code: "ASTER-TEST-CODE" });

      await expect(useCase.execute({ userId: "user-3", code: "ASTER-TEST-CODE" })).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    it("rejects the same user redeeming the same multi-use code twice", async () => {
      const giftCodes = new FakeGiftCodeRepository();
      const subs = new FakeSubscriptionRepository();
      seedCode(giftCodes, { maxRedemptions: 5 });
      const useCase = new RedeemGiftCodeUseCase(giftCodes, subs);

      await useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" });
      // user-1's subscription is now "pro", so the second attempt should be rejected
      // for already-has-a-paid-plan before it even gets to the double-redeem check --
      // simulate a downgrade back to free to isolate the double-redeem guard itself.
      subs.setPlan("user-1", "free");

      await expect(useCase.execute({ userId: "user-1", code: "ASTER-TEST-CODE" })).rejects.toBeInstanceOf(
        ConflictError,
      );
    });
  });
});
