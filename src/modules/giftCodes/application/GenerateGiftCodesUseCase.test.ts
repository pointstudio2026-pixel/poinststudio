import { describe, expect, it, vi } from "vitest";
import { GenerateGiftCodesUseCase } from "@/modules/giftCodes/application/GenerateGiftCodesUseCase";
import { FakeGiftCodeRepository } from "@/modules/giftCodes/testing/fakes";
import { ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("GenerateGiftCodesUseCase", () => {
  it("generates the requested number of unique codes", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    const codes = await useCase.execute({
      adminUserId: "admin-1",
      planCode: "pro",
      grantDays: 31,
      count: 20,
      batchLabel: "launch-event",
      expiresAt: null,
    });

    expect(codes).toHaveLength(20);
    expect(new Set(codes.map((c) => c.code)).size).toBe(20);
    expect(codes.every((c) => c.planCode === "pro")).toBe(true);
    expect(codes.every((c) => c.batchLabel === "launch-event")).toBe(true);
    expect(codes.every((c) => c.redeemedByUserId === null)).toBe(true);
    expect(repo.codes).toHaveLength(20);
  });

  it("rejects a free-plan code (선물 코드는 유료 등급만)", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    await expect(
      useCase.execute({
        adminUserId: "admin-1",
        planCode: "free",
        grantDays: 31,
        count: 1,
        batchLabel: null,
        expiresAt: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a count outside 1~500", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    await expect(
      useCase.execute({
        adminUserId: "admin-1",
        planCode: "pro",
        grantDays: 31,
        count: 501,
        batchLabel: null,
        expiresAt: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects grantDays below 1", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    await expect(
      useCase.execute({
        adminUserId: "admin-1",
        planCode: "pro",
        grantDays: 0,
        count: 1,
        batchLabel: null,
        expiresAt: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("defaults maxRedemptions to 1 when not specified", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    const [code] = await useCase.execute({
      adminUserId: "admin-1",
      planCode: "pro",
      grantDays: 31,
      count: 1,
      batchLabel: null,
      expiresAt: null,
    });

    expect(code?.maxRedemptions).toBe(1);
  });

  it("generates a multi-use code when maxRedemptions is set", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    const [code] = await useCase.execute({
      adminUserId: "admin-1",
      planCode: "pro",
      grantDays: 31,
      count: 1,
      batchLabel: null,
      expiresAt: null,
      maxRedemptions: 10,
    });

    expect(code?.maxRedemptions).toBe(10);
    expect(code?.redemptionCount).toBe(0);
  });

  it("rejects maxRedemptions below 1", async () => {
    const repo = new FakeGiftCodeRepository();
    const useCase = new GenerateGiftCodesUseCase(repo);

    await expect(
      useCase.execute({
        adminUserId: "admin-1",
        planCode: "pro",
        grantDays: 31,
        count: 1,
        batchLabel: null,
        expiresAt: null,
        maxRedemptions: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
