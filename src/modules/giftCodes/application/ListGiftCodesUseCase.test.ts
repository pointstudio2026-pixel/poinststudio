import { describe, expect, it } from "vitest";
import { ListGiftCodesUseCase } from "@/modules/giftCodes/application/ListGiftCodesUseCase";
import { FakeGiftCodeRepository } from "@/modules/giftCodes/testing/fakes";

describe("ListGiftCodesUseCase", () => {
  it("lists codes, filtered by batchLabel when provided", async () => {
    const repo = new FakeGiftCodeRepository();
    await repo.createMany([
      { code: "A", planCode: "pro", grantDays: 31, batchLabel: "batch-1", expiresAt: null, createdByUserId: "admin-1" },
      { code: "B", planCode: "pro", grantDays: 31, batchLabel: "batch-2", expiresAt: null, createdByUserId: "admin-1" },
    ]);
    const useCase = new ListGiftCodesUseCase(repo);

    const all = await useCase.execute();
    expect(all).toHaveLength(2);

    const filtered = await useCase.execute({ batchLabel: "batch-1" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.code).toBe("A");
  });
});
