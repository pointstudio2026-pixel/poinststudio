import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { GET as getSubscriptionHandler } from "@/app/api/subscription/route";
import { GET as getPlansHandler } from "@/app/api/subscription/plans/route";
import { GET as getUsageHandler } from "@/app/api/subscription/usage/route";
import { POST as checkPlanHandler } from "@/app/api/subscription/check/route";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";

const TEST_EMAIL_PREFIX = "task017-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

async function createSessionCookie(role: "designer" | "admin" = "designer") {
  const userRepository = new PrismaUserRepository();
  const tokenService = new TokenService(new PrismaRefreshTokenRepository());
  const user = await userRepository.create({
    email: uniqueEmail(),
    passwordHash: await new Argon2PasswordHasher().hash("password123"),
  });
  if (role === "admin") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  }
  const tokens = await tokenService.issueTokenPair({ id: user.id, role });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

function getRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

function postRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

describe("Subscription API routes", () => {
  it("GET /api/subscription auto-provisions Free for a new user (플랜 조회)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await getSubscriptionHandler(getRequest("/api/subscription", cookie));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.subscription.planCode).toBe("free");
  });

  it("GET /api/subscription/plans lists all three tiers", async () => {
    const { cookie } = await createSessionCookie();
    const res = await getPlansHandler(getRequest("/api/subscription/plans", cookie));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.plans.map((p: { planCode: string }) => p.planCode).sort()).toEqual([
      "free",
      "pro",
      "studio",
    ]);
  });

  it("POST /api/subscription/check blocks once the Free limit is used up (Free 한도 초과)", async () => {
    const { userId, cookie } = await createSessionCookie();
    await prisma.usageLog.create({
      data: {
        userId,
        eventType: GENERATION_EVENT_TYPE,
        quantity: PLAN_LIMITS.free.monthlyGenerationLimit,
      },
    });

    const res = await checkPlanHandler(
      postRequest("/api/subscription/check", { eventType: GENERATION_EVENT_TYPE }, cookie),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.allowed).toBe(false);
    expect(body.data.used).toBe(PLAN_LIMITS.free.monthlyGenerationLimit);
  });

  it("GET /api/subscription/usage blocks a designer from another user's usage, allows an admin (권한 검증)", async () => {
    const owner = await createSessionCookie();
    const otherDesigner = await createSessionCookie();
    const admin = await createSessionCookie("admin");

    const deniedRes = await getUsageHandler(
      getRequest(`/api/subscription/usage?userId=${owner.userId}`, otherDesigner.cookie),
    );
    expect(deniedRes.status).toBe(403);

    const adminRes = await getUsageHandler(
      getRequest(`/api/subscription/usage?userId=${owner.userId}`, admin.cookie),
    );
    expect(adminRes.status).toBe(200);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await getSubscriptionHandler(getRequest("/api/subscription"));
    expect(res.status).toBe(401);
  });
});
