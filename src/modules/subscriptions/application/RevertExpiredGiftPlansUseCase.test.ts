import { describe, expect, it } from "vitest";
import { RevertExpiredGiftPlansUseCase } from "@/modules/subscriptions/application/RevertExpiredGiftPlansUseCase";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";

describe("RevertExpiredGiftPlansUseCase", () => {
  it("reverts an expired gift-code grant back to free", async () => {
    const subs = new FakeSubscriptionRepository();
    await subs.grantTemporaryPlan("user-1", "pro", new Date("2020-01-01"), new Date("2020-02-01"));
    const useCase = new RevertExpiredGiftPlansUseCase(subs);

    const result = await useCase.execute();

    expect(result.reverted).toBe(1);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("free");
    expect(subs.subscriptions.get("user-1")?.currentPeriodEnd).toBeNull();
  });

  it("leaves an admin-granted permanent plan alone (currentPeriodEnd is null)", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    const useCase = new RevertExpiredGiftPlansUseCase(subs);

    const result = await useCase.execute();

    expect(result.reverted).toBe(0);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("pro");
  });

  it("leaves a not-yet-expired gift grant alone", async () => {
    const subs = new FakeSubscriptionRepository();
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subs.grantTemporaryPlan("user-1", "studio", new Date(), farFuture);
    const useCase = new RevertExpiredGiftPlansUseCase(subs);

    const result = await useCase.execute();

    expect(result.reverted).toBe(0);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("studio");
  });
});
