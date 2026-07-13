import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { GET as getHandler, PATCH as patchHandler, DELETE as deleteHandler } from "@/app/api/projects/[id]/route";
import { GET as getActivityHandler } from "@/app/api/projects/[id]/activity/route";

const TEST_EMAIL_PREFIX = "task006-route";

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

async function createProject(cookie: string, name = "Brand") {
  const res = await createProjectHandler(
    new NextRequest("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name }),
    }),
  );
  const { data } = await res.json();
  return data.projectId as string;
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Project detail routes", () => {
  it("returns 404 for a project that doesn't exist (존재하지 않는 프로젝트)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await getHandler(
      new NextRequest("http://localhost/api/projects/does-not-exist", { headers: { cookie } }),
      withParams("00000000-0000-0000-0000-000000000000"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when another user tries to load the project (다른 사용자 프로젝트 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProject(owner.cookie);

    const res = await getHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, {
        headers: { cookie: other.cookie },
      }),
      withParams(projectId),
    );
    expect(res.status).toBe(404);
  });

  it("renames a project via PATCH (자동 저장 / 프로젝트 이름 변경)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie, "Old Name");

    const res = await patchHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ name: "New Name" }),
      }),
      withParams(projectId),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.project.name).toBe("New Name");

    const saved = await prisma.project.findUnique({ where: { id: projectId } });
    expect(saved?.name).toBe("New Name");
  });

  it("returns 404 after the project is deleted (삭제 후 접근)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie);

    const deleteRes = await deleteHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { cookie },
      }),
      withParams(projectId),
    );
    expect(deleteRes.status).toBe(200);

    const getRes = await getHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, { headers: { cookie } }),
      withParams(projectId),
    );
    expect(getRes.status).toBe(404);
  });

  it("returns the project's own activity, most recent first", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie, "Brand");
    await patchHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ isFavorite: true }),
      }),
      withParams(projectId),
    );

    const res = await getActivityHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}/activity`, {
        headers: { cookie },
      }),
      withParams(projectId),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.activity[0].eventType).toBe("PROJECT_UPDATED");
    expect(body.data.activity.map((a: { eventType: string }) => a.eventType)).toContain(
      "PROJECT_CREATED",
    );
  });
});
