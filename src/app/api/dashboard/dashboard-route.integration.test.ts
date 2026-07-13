import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { GET as createProjectHandler } from "@/app/api/dashboard/route";
import { POST as createProjectPostHandler } from "@/app/api/projects/route";

const TEST_EMAIL_PREFIX = "task005-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

async function createSessionCookie() {
  const userRepository = new PrismaUserRepository();
  const tokenService = new TokenService(new PrismaRefreshTokenRepository());
  const user = await userRepository.create({
    email: uniqueEmail(),
    passwordHash: await new Argon2PasswordHasher().hash("password123"),
  });
  const tokens = await tokenService.issueTokenPair({ id: user.id, role: user.role });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

describe("GET /api/dashboard", () => {
  it("returns an empty dashboard for a brand-new user", async () => {
    const { cookie } = await createSessionCookie();
    const res = await createProjectHandler(
      new NextRequest("http://localhost/api/dashboard", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.projects).toEqual([]);
    expect(body.data.subscription.planCode).toBe("free");
    expect(body.data.usage.generation.limit).toBe(10);
  });

  it("returns real projects created via POST /api/projects", async () => {
    const { cookie } = await createSessionCookie();
    await createProjectPostHandler(
      new NextRequest("http://localhost/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ name: "Real Brand" }),
      }),
    );

    const res = await createProjectHandler(
      new NextRequest("http://localhost/api/dashboard", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(body.data.projects).toHaveLength(1);
    expect(body.data.projects[0].name).toBe("Real Brand");
    expect(body.data.recentActivity.some((a: { eventType: string }) => a.eventType === "PROJECT_CREATED")).toBe(true);
  });

  it("rejects unauthenticated requests (API 오류 처리)", async () => {
    const res = await createProjectHandler(new NextRequest("http://localhost/api/dashboard"));
    expect(res.status).toBe(401);
  });
});
