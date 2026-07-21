import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { GET as getAdminDashboardHandler } from "@/app/api/admin/dashboard/route";
import { GET as getAdminAnalyticsHandler } from "@/app/api/admin/analytics/route";
import { GET as getAdminUsersHandler } from "@/app/api/admin/users/route";
import { GET as getAdminProvidersHandler } from "@/app/api/admin/providers/route";
import { GET as getAdminAuditLogsHandler } from "@/app/api/admin/audit-logs/route";
import { POST as createAnnouncementHandler, GET as listAnnouncementsHandler } from "@/app/api/admin/announcements/route";
import { DELETE as deactivateAnnouncementHandler } from "@/app/api/admin/announcements/[id]/route";
import { DELETE as deleteUserHandler } from "@/app/api/admin/users/[id]/route";
import { PATCH as changeUserPlanHandler } from "@/app/api/admin/users/[id]/plan/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { GET as getSubscriptionHandler } from "@/app/api/subscription/route";
import { authContainer } from "@/modules/auth/container";
import { OAuthConsentRequiredError } from "@/modules/auth/application/OAuthLoginUseCase";

const TEST_EMAIL_PREFIX = "task020-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({
    // 삭제된 유저는 email이 deleted.aster.invalid로 익명화되어 TEST_EMAIL_PREFIX
    // 패턴을 더 이상 안 타므로, softDeleteUser의 tombstone 도메인도 같이 정리한다.
    where: { OR: [{ email: { startsWith: TEST_EMAIL_PREFIX } }, { email: { endsWith: "@deleted.aster.invalid" } }] },
  });
});

async function createSessionCookie(
  role: "designer" | "admin" = "designer",
  adminTier?: "super_admin" | "manager" | "support",
) {
  const userRepository = new PrismaUserRepository();
  const tokenService = new TokenService(new PrismaRefreshTokenRepository());
  const user = await userRepository.create({
    email: uniqueEmail(),
    passwordHash: await new Argon2PasswordHasher().hash("password123"),
  });
  if (role === "admin") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin", adminTier } });
  }
  const tokens = await tokenService.issueTokenPair({ id: user.id, role, adminTier });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

function postRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

function patchRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

describe("Admin API routes", () => {
  it("rejects a non-admin user (권한 없는 접근)", async () => {
    const { cookie } = await createSessionCookie("designer");
    const res = await getAdminDashboardHandler(
      new NextRequest("http://localhost/api/admin/dashboard", { headers: { cookie } }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await getAdminDashboardHandler(new NextRequest("http://localhost/api/admin/dashboard"));
    expect(res.status).toBe(401);
  });

  it("returns dashboard summary with real provider health and queue status for an admin (통계 조회 / Provider 상태 / Queue 상태 확인)", async () => {
    const { cookie } = await createSessionCookie("admin");
    const res = await getAdminDashboardHandler(
      new NextRequest("http://localhost/api/admin/dashboard", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.summary.providerHealth).toHaveLength(3);
    expect(body.data.summary.providerHealth.every((p: { healthy: boolean }) => p.healthy)).toBe(true);
    expect(body.data.summary.queueStatus).toHaveLength(4);
    expect(body.data.summary.errorRates).toHaveLength(4);
  });

  it("returns analytics trends for an admin", async () => {
    const { cookie } = await createSessionCookie("admin");
    const res = await getAdminAnalyticsHandler(
      new NextRequest("http://localhost/api/admin/analytics", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.analytics.usageTrend.length).toBeGreaterThan(0);
    expect(body.data.analytics.costTrend.length).toBeGreaterThan(0);
  });

  it("searches users by email (사용자 검색)", async () => {
    const admin = await createSessionCookie("admin");
    const other = await createSessionCookie("designer");
    await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, other.cookie));

    const otherUser = await prisma.user.findUnique({ where: { id: other.userId } });

    const res = await getAdminUsersHandler(
      new NextRequest(`http://localhost/api/admin/users?query=${encodeURIComponent(otherUser!.email)}`, {
        headers: { cookie: admin.cookie },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0].email).toBe(otherUser!.email);
    expect(body.data.users[0].projectCount).toBe(1);
  });

  it("reports real provider health (Provider 장애 표시)", async () => {
    const { cookie } = await createSessionCookie("admin");
    const res = await getAdminProvidersHandler(
      new NextRequest("http://localhost/api/admin/providers", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.providers).toHaveLength(3);
  });

  it("filters audit logs by eventType (Audit Log 필터)", async () => {
    const { cookie, userId } = await createSessionCookie("admin");
    await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));

    const res = await getAdminAuditLogsHandler(
      new NextRequest(
        `http://localhost/api/admin/audit-logs?eventType=PROJECT_CREATED&userId=${userId}`,
        { headers: { cookie } },
      ),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.logs.length).toBeGreaterThan(0);
    expect(body.data.logs.every((l: { eventType: string }) => l.eventType === "PROJECT_CREATED")).toBe(true);
  });

  it("creates and deactivates a system announcement", async () => {
    const { cookie } = await createSessionCookie("admin", "super_admin");
    const createRes = await createAnnouncementHandler(
      postRequest("/api/admin/announcements", { message: "점검 예정" }, cookie),
    );
    const createBody = await createRes.json();
    expect(createRes.status).toBe(201);

    const listRes = await listAnnouncementsHandler(
      new NextRequest("http://localhost/api/admin/announcements", { headers: { cookie } }),
    );
    expect((await listRes.json()).data.announcements).toHaveLength(1);

    const deactivateRes = await deactivateAnnouncementHandler(
      new NextRequest(`http://localhost/api/admin/announcements/${createBody.data.announcement.id}`, {
        method: "DELETE",
        headers: { cookie },
      }),
      { params: Promise.resolve({ id: createBody.data.announcement.id }) },
    );
    expect(deactivateRes.status).toBe(200);

    const listAfter = await listAnnouncementsHandler(
      new NextRequest("http://localhost/api/admin/announcements", { headers: { cookie } }),
    );
    expect((await listAfter.json()).data.announcements).toHaveLength(0);
  });

  it("frees the deleted user's email for a brand-new registration (실사용자가 겪은 버그: 삭제 후 같은 이메일로 재가입 불가)", async () => {
    const admin = await createSessionCookie("admin", "super_admin");
    const targetEmail = uniqueEmail();
    const userRepository = new PrismaUserRepository();
    const target = await userRepository.create({
      email: targetEmail,
      passwordHash: await new Argon2PasswordHasher().hash("password123"),
    });

    const deleteRes = await deleteUserHandler(
      new NextRequest(`http://localhost/api/admin/users/${target.id}`, {
        method: "DELETE",
        headers: { cookie: admin.cookie },
      }),
      { params: Promise.resolve({ id: target.id }) },
    );
    expect(deleteRes.status).toBe(200);

    // 삭제 직후 DB에는 email이 더 이상 남아있지 않아야 한다(익명화됨).
    const stillThere = await prisma.user.findUnique({ where: { email: targetEmail } });
    expect(stillThere).toBeNull();

    // 같은 이메일로 새로 회원가입하면 더 이상 "이미 사용 중"으로 막히면 안 된다.
    const registerRes = await registerHandler(
      postRequest("/api/auth/register", { email: targetEmail, password: "password123", agreedToTerms: true }),
    );
    expect(registerRes.status).toBe(201);
  });

  it("frees the deleted user's Google account for a brand-new OAuth sign-in (실사용자가 겪은 버그: 삭제 후 같은 구글 계정으로 재가입 시 '삭제된 계정입니다'로 막힘)", async () => {
    const admin = await createSessionCookie("admin", "super_admin");
    const targetEmail = uniqueEmail();
    const providerAccountId = `g-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const signup = await authContainer.completeOAuthSignupUseCase.execute({
      provider: "google",
      profile: { providerAccountId, email: targetEmail, name: "Target", emailVerified: true },
    });

    const deleteRes = await deleteUserHandler(
      new NextRequest(`http://localhost/api/admin/users/${signup.user.id}`, {
        method: "DELETE",
        headers: { cookie: admin.cookie },
      }),
      { params: Promise.resolve({ id: signup.user.id }) },
    );
    expect(deleteRes.status).toBe(200);

    // 삭제 직후 이 구글 계정으로 다시 로그인을 시도하면 "삭제된 계정입니다"로
    // 막히지 않고, 완전히 새로운 가입으로 취급되어야 한다(동의 절차 필요).
    const attempt = authContainer.oauthLoginUseCase.execute({
      provider: "google",
      profile: { providerAccountId, email: targetEmail, name: "Target", emailVerified: true },
    });
    await expect(attempt).rejects.toBeInstanceOf(OAuthConsentRequiredError);
  });

  it("lets a super admin change another user's plan (요금제 변경은 관리자 전용)", async () => {
    const admin = await createSessionCookie("admin", "super_admin");
    const target = await createSessionCookie("designer");

    const res = await changeUserPlanHandler(
      patchRequest(`/api/admin/users/${target.userId}/plan`, { planCode: "studio" }, admin.cookie),
      { params: Promise.resolve({ id: target.userId }) },
    );
    expect(res.status).toBe(200);

    const subRes = await getSubscriptionHandler(
      new NextRequest("http://localhost/api/subscription", { headers: { cookie: target.cookie } }),
    );
    const subBody = await subRes.json();
    expect(subBody.data.subscription.planCode).toBe("studio");
  });

  it("rejects a non-admin trying to change a plan (일반 계정은 절대 못 바꿈)", async () => {
    const designer = await createSessionCookie("designer");
    const target = await createSessionCookie("designer");

    const res = await changeUserPlanHandler(
      patchRequest(`/api/admin/users/${target.userId}/plan`, { planCode: "studio" }, designer.cookie),
      { params: Promise.resolve({ id: target.userId }) },
    );
    expect(res.status).toBe(403);
  });

  it("rejects an admin changing their own plan (자기 자신 변경 방지)", async () => {
    const admin = await createSessionCookie("admin", "super_admin");

    const res = await changeUserPlanHandler(
      patchRequest(`/api/admin/users/${admin.userId}/plan`, { planCode: "studio" }, admin.cookie),
      { params: Promise.resolve({ id: admin.userId }) },
    );
    expect(res.status).toBe(400);
  });
});
