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

const TEST_EMAIL_PREFIX = "task020-route";

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

function postRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
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
    const { cookie } = await createSessionCookie("admin");
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
});
