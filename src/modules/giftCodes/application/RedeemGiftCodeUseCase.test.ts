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

  it("rejects an already-redeemed code", async () => {
    const giftCodes = new FakeGiftCodeRepository();
    const subs = new FakeSubscriptionRepository();
    seedCode(giftCodes, { redeemedByUserId: "someone-else", redeemedAt: new Date() });
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
});
