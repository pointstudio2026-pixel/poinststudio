import { describe, expect, it } from "vitest";
import { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import {
  FakeSubscriptionRepository,
  FakeUsageRepository,
} from "@/modules/subscriptions/testing/fakes";
import { AuthorizationError } from "@/shared/errors/AppError";

describe("GetUsageSummaryUseCase", () => {
  it("lets a user read their own summary", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-1", "pro");
    usage.seed({ userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: 3 }, new Date());
    const useCase = new GetUsageSummaryUseCase(subs, usage);

    const summary = await useCase.execute({ requesterId: "user-1", requesterRole: "designer" });

    expect(summary.planCode).toBe("pro");
    expect(summary.generation.used).toBe(3);
  });

  it("blocks a designer from reading another user's summary (권한 검증)", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    const useCase = new GetUsageSummaryUseCase(subs, usage);

    await expect(
      useCase.execute({
        requesterId: "user-1",
        requesterRole: "designer",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("lets an admin read another user's summary (관리자 사용량 조회)", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-2", "studio");
    usage.seed({ userId: "user-2", eventType: GENERATION_EVENT_TYPE, quantity: 7 }, new Date());
    const useCase = new GetUsageSummaryUseCase(subs, usage);

    const summary = await useCase.execute({
      requesterId: "admin-1",
      requesterRole: "admin",
      targetUserId: "user-2",
    });

    expect(summary.planCode).toBe("studio");
    expect(summary.generation.used).toBe(7);
  });
});
