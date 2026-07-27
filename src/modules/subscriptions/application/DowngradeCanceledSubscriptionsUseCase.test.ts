import { describe, expect, it } from "vitest";
import { DowngradeCanceledSubscriptionsUseCase } from "@/modules/subscriptions/application/DowngradeCanceledSubscriptionsUseCase";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";

describe("DowngradeCanceledSubscriptionsUseCase", () => {
  it("downgrades a subscription that was scheduled to cancel once its period has passed", async () => {
    const subs = new FakeSubscriptionRepository();
    await subs.grantTemporaryPlan("user-1", "pro", new Date("2020-01-01"), new Date("2020-02-01"));
    await subs.scheduleCancelAtPeriodEnd("user-1");
    const useCase = new DowngradeCanceledSubscriptionsUseCase(subs);

    const result = await useCase.execute();

    expect(result.downgraded).toBe(1);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("free");
    expect(subs.subscriptions.get("user-1")?.cancelAtPeriodEnd).toBe(false);
  });

  it("leaves a scheduled cancellation alone until its period actually ends", async () => {
    const subs = new FakeSubscriptionRepository();
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subs.grantTemporaryPlan("user-1", "pro", new Date(), farFuture);
    await subs.scheduleCancelAtPeriodEnd("user-1");
    const useCase = new DowngradeCanceledSubscriptionsUseCase(subs);

    const result = await useCase.execute();

    expect(result.downgraded).toBe(0);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("pro");
  });

  it("does not touch an expired plan that was never scheduled to cancel (that's the gift-expiry worker's job)", async () => {
    const subs = new FakeSubscriptionRepository();
    await subs.grantTemporaryPlan("user-1", "pro", new Date("2020-01-01"), new Date("2020-02-01"));
    const useCase = new DowngradeCanceledSubscriptionsUseCase(subs);

    const result = await useCase.execute();

    expect(result.downgraded).toBe(0);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("pro");
  });
});
