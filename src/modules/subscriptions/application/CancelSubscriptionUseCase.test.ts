import { describe, expect, it } from "vitest";
import { CancelSubscriptionUseCase } from "@/modules/subscriptions/application/CancelSubscriptionUseCase";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";

describe("CancelSubscriptionUseCase", () => {
  it("schedules cancellation without immediately downgrading the plan", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    const useCase = new CancelSubscriptionUseCase(subs);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.cancelAtPeriodEnd).toBe(true);
    expect(result.planCode).toBe("pro");
  });

  it("rejects cancelling an already-free plan", async () => {
    const subs = new FakeSubscriptionRepository();
    await subs.createDefault("user-1");
    const useCase = new CancelSubscriptionUseCase(subs);

    await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow("취소할 구독이 없습니다.");
  });

  it("rejects cancelling a plan that is already scheduled to cancel", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    const useCase = new CancelSubscriptionUseCase(subs);
    await useCase.execute({ userId: "user-1" });

    await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow("이미 취소가 예약된 구독입니다.");
  });
});
