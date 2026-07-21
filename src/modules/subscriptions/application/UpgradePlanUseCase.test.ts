import { describe, expect, it, vi } from "vitest";
import { UpgradePlanUseCase } from "@/modules/subscriptions/application/UpgradePlanUseCase";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";
import { FakeAdminRepository } from "@/modules/admin/testing/fakes";
import { ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function buildAdminRepository(targetUserId: string) {
  const admin = new FakeAdminRepository();
  admin.users.push({
    id: targetUserId,
    email: "target@aster.dev",
    name: null,
    role: "designer",
    adminTier: null,
    status: "active",
    planCode: "free",
    projectCount: 0,
    generationCount: 0,
    lastLoginAt: null,
    createdAt: new Date(),
  });
  return admin;
}

describe("UpgradePlanUseCase (관리자 전용 -- 셀프서비스 요금제 변경은 잠김)", () => {
  it("changes a target user's plan from the default Free (관리자가 대상 유저 요금제 변경)", async () => {
    const subs = new FakeSubscriptionRepository();
    const admin = buildAdminRepository("user-1");
    const useCase = new UpgradePlanUseCase(subs, admin);

    const result = await useCase.execute({ targetUserId: "user-1", actingUserId: "admin-1", planCode: "pro" });

    expect(result.previousPlanCode).toBe("free");
    expect(result.subscription.planCode).toBe("pro");
    expect(subs.subscriptions.get("user-1")?.planCode).toBe("pro");
  });

  it("reports the real previous plan when upgrading again (Pro -> Studio)", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "pro");
    const admin = buildAdminRepository("user-1");
    const useCase = new UpgradePlanUseCase(subs, admin);

    const result = await useCase.execute({ targetUserId: "user-1", actingUserId: "admin-1", planCode: "studio" });

    expect(result.previousPlanCode).toBe("pro");
    expect(result.subscription.planCode).toBe("studio");
  });

  it("supports downgrading back to free", async () => {
    const subs = new FakeSubscriptionRepository();
    subs.setPlan("user-1", "studio");
    const admin = buildAdminRepository("user-1");
    const useCase = new UpgradePlanUseCase(subs, admin);

    const result = await useCase.execute({ targetUserId: "user-1", actingUserId: "admin-1", planCode: "free" });

    expect(result.previousPlanCode).toBe("studio");
    expect(result.subscription.planCode).toBe("free");
  });

  it("rejects changing your own plan (자기 자신 변경 방지)", async () => {
    const subs = new FakeSubscriptionRepository();
    const admin = buildAdminRepository("admin-1");
    const useCase = new UpgradePlanUseCase(subs, admin);

    await expect(
      useCase.execute({ targetUserId: "admin-1", actingUserId: "admin-1", planCode: "studio" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a target user that doesn't exist", async () => {
    const subs = new FakeSubscriptionRepository();
    const admin = new FakeAdminRepository();
    const useCase = new UpgradePlanUseCase(subs, admin);

    await expect(
      useCase.execute({ targetUserId: "ghost", actingUserId: "admin-1", planCode: "studio" }),
    ).rejects.toThrow();
  });
});
