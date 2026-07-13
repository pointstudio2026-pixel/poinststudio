import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { PrismaProjectRepository } from "@/modules/projects/infrastructure/PrismaProjectRepository";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { NotFoundError } from "@/shared/errors/AppError";

const TEST_EMAIL_PREFIX = "task001-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  // Project rows cascade-delete with their owning user.
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

function jsonRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/projects", () => {
  it("creates a project for the authenticated user (정상 생성)", async () => {
    const { userId, cookie } = await createSessionCookie();

    const res = await createProjectHandler(jsonRequest("/api/projects", { name: "My Brand" }, cookie));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.status).toBe("draft");

    const saved = await prisma.project.findUnique({ where: { id: body.data.projectId } });
    expect(saved?.userId).toBe(userId);
    expect(saved?.name).toBe("My Brand");
    expect(saved?.currentStep).toBe("brand_interview");
  });

  it("rejects an empty name (이름 미입력)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await createProjectHandler(jsonRequest("/api/projects", { name: "" }, cookie));
    expect(res.status).toBe(400);
  });

  it("rejects a name over 100 characters (100자 초과)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await createProjectHandler(
      jsonRequest("/api/projects", { name: "a".repeat(101) }, cookie),
    );
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated requests (인증 없는 요청)", async () => {
    const res = await createProjectHandler(jsonRequest("/api/projects", { name: "My Brand" }));
    expect(res.status).toBe(401);
  });

  it("does not let a different user read the project (다른 사용자 프로젝트 접근 불가)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();

    const res = await createProjectHandler(
      jsonRequest("/api/projects", { name: "Owner's Brand" }, owner.cookie),
    );
    const { data } = await res.json();

    const getProjectUseCase = new GetProjectUseCase(new PrismaProjectRepository());
    await expect(
      getProjectUseCase.execute({ projectId: data.projectId, userId: other.userId }),
    ).rejects.toBeInstanceOf(NotFoundError);

    // The real owner can still read it.
    const own = await getProjectUseCase.execute({
      projectId: data.projectId,
      userId: owner.userId,
    });
    expect(own.name).toBe("Owner's Brand");
  });
});
