import { describe, expect, it } from "vitest";
import { CancelSubscriptionUseCase } from "@/modules/subscriptions/application/CancelSubscriptionUseCase";
import { ResumeSubscriptionUseCase } from "@/modules/subscriptions/application/ResumeSubscriptionUseCase";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";

describe("ResumeSubscriptionUseCase", () => {
  it("undoes a scheduled cancellation", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    await new CancelSubscriptionUseCase(subs).execute({ userId: "user-1" });

    const result = await new ResumeSubscriptionUseCase(subs).execute({ userId: "user-1" });

    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.planCode).toBe("pro");
  });

  it("rejects resuming when nothing is scheduled to cancel", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    const useCase = new ResumeSubscriptionUseCase(subs);

    await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow("예약된 취소가 없습니다.");
  });
});
