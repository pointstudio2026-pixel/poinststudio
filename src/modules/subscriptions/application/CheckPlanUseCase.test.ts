import { describe, expect, it } from "vitest";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { getCurrentBillingPeriodStart } from "@/modules/subscriptions/domain/billingPeriod";
import {
  FakeSubscriptionRepository,
  FakeUsageRepository,
} from "@/modules/subscriptions/testing/fakes";

describe("CheckPlanUseCase", () => {
  it("provisions a default Free subscription for a brand-new user", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    const useCase = new CheckPlanUseCase(subs, usage);

    const result = await useCase.execute({ userId: "user-1", eventType: GENERATION_EVENT_TYPE });

    expect(result.planCode).toBe("free");
    expect(result.allowed).toBe(true);
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("free");
  });

  it("blocks generation once the Free plan's monthly limit is reached", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-1", "free");
    usage.seed(
      { userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit },
      new Date(),
    );
    const useCase = new CheckPlanUseCase(subs, usage);

    const result = await useCase.execute({ userId: "user-1", eventType: GENERATION_EVENT_TYPE });

    expect(result.allowed).toBe(false);
    expect(result.used).toBe(PLAN_LIMITS.free.monthlyGenerationLimit);
    expect(result.limit).toBe(PLAN_LIMITS.free.monthlyGenerationLimit);
  });

  it("gives a Pro user a higher limit than Free (Pro 사용량)", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-pro", "pro");
    usage.seed(
      { userId: "user-pro", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit + 5 },
      new Date(),
    );
    const useCase = new CheckPlanUseCase(subs, usage);

    const result = await useCase.execute({ userId: "user-pro", eventType: GENERATION_EVENT_TYPE });

    expect(result.planCode).toBe("pro");
    expect(result.limit).toBe(PLAN_LIMITS.pro.monthlyGenerationLimit);
    expect(result.allowed).toBe(true); // still well under the Pro limit
  });

  it("gives a Studio user the highest limit (Studio 사용량)", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-studio", "studio");
    usage.seed(
      { userId: "user-studio", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.pro.monthlyGenerationLimit + 5 },
      new Date(),
    );
    const useCase = new CheckPlanUseCase(subs, usage);

    const result = await useCase.execute({ userId: "user-studio", eventType: GENERATION_EVENT_TYPE });

    expect(result.planCode).toBe("studio");
    expect(result.limit).toBe(PLAN_LIMITS.studio.monthlyGenerationLimit);
    expect(result.allowed).toBe(true); // over Pro's limit, still fine on Studio
  });

  it("ignores usage from before the current billing period (월간 초기화)", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    subs.setPlan("user-1", "free");

    const lastMonth = new Date(getCurrentBillingPeriodStart());
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1, 15);
    usage.seed(
      { userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit },
      lastMonth,
    );

    const useCase = new CheckPlanUseCase(subs, usage);
    const result = await useCase.execute({ userId: "user-1", eventType: GENERATION_EVENT_TYPE });

    expect(result.used).toBe(0);
    expect(result.allowed).toBe(true);
  });

  it("does not gate event types without a defined limit yet", async () => {
    const subs = new FakeSubscriptionRepository();
    const usage = new FakeUsageRepository();
    const useCase = new CheckPlanUseCase(subs, usage);

    const result = await useCase.execute({ userId: "user-1", eventType: "mockup_render" });
    expect(result.allowed).toBe(true);
  });
});
