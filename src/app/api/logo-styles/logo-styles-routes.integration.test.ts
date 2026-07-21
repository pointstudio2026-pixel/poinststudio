import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { POST as selectDeliverableTypeHandler } from "@/app/api/projects/[id]/deliverable-type/route";
import { GET as getInterviewHandler } from "@/app/api/interview/[projectId]/route";
import { POST as saveAnswerHandler } from "@/app/api/interview/answer/route";
import { POST as completeInterviewHandler } from "@/app/api/interview/complete/route";
import { POST as recommendStylesHandler } from "@/app/api/styles/recommend/route";
import { POST as selectStyleHandler } from "@/app/api/styles/select/route";
import { POST as executeAsterBrainHandler } from "@/app/api/aster-brain/execute/route";
import { POST as selectAsterBrainHandler } from "@/app/api/aster-brain/select/route";
import { GET as listLogoStylesHandler } from "@/app/api/logo-styles/route";
import { POST as recommendLogoStyleHandler } from "@/app/api/logo-styles/recommend/route";
import { POST as selectLogoStyleHandler } from "@/app/api/logo-styles/select/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task021-route";

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
    emailVerifiedAt: new Date(),
  });
  const tokens = await tokenService.issueTokenPair({ id: user.id, role: user.role });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

function postRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function createProjectWithSelectedStrategy(cookie: string) {
  const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
  const { data } = await createRes.json();
  const projectId = data.projectId as string;

  await selectDeliverableTypeHandler(
    postRequest(`/api/projects/${projectId}/deliverable-type`, { deliverableType: "브랜딩 & 로고" }, cookie),
    { params: Promise.resolve({ id: projectId }) },
  );

  await getInterviewHandler(
    new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
    { params: Promise.resolve({ projectId }) },
  );
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswerHandler(
      postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer: `구체적인 ${q.key} 답변` }, cookie),
    );
  }
  await completeInterviewHandler(postRequest("/api/interview/complete", { projectId }, cookie));

  const recommendRes = await recommendStylesHandler(postRequest("/api/styles/recommend", { projectId }, cookie));
  const { data: recommendData } = await recommendRes.json();
  const styleId = recommendData.recommendations[0].style.id as string;
  await selectStyleHandler(
    postRequest("/api/styles/select", { projectId, primaryStyleId: styleId, secondaryStyleIds: [] }, cookie),
  );

  await executeAsterBrainHandler(postRequest("/api/aster-brain/execute", { projectId }, cookie));
  await selectAsterBrainHandler(postRequest("/api/aster-brain/select", { projectId, candidateIndex: 0 }, cookie));

  return projectId;
}

describe("Logo Style Selector API routes", () => {
  it("lists the seeded logo style categories (GET /logo-styles)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await listLogoStylesHandler(new NextRequest("http://localhost/api/logo-styles", { headers: { cookie } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.categories.length).toBeGreaterThanOrEqual(5);
    expect(body.data.categories[0]).toHaveProperty("sampleImageUrl");
  });

  it("recommends logo styles once a Brand Strategy candidate is selected (정상 추천)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(cookie);

    const res = await recommendLogoStyleHandler(postRequest("/api/logo-styles/recommend", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.recommendations.length).toBeGreaterThanOrEqual(5);
    expect(body.data.recommendations[0].reason).toBeTruthy();
    expect(body.data.recommendations[0].representativeSubStyle).toBeTruthy();
  });

  it("rejects recommendation before a Brand Strategy candidate is selected (전략 선택 누락)", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
    const { data } = await createRes.json();

    const res = await recommendLogoStyleHandler(
      postRequest("/api/logo-styles/recommend", { projectId: data.projectId }, cookie),
    );
    expect(res.status).toBe(409);
  });

  it("selects a logo style and advances the project to the generation step (정상 선택)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(cookie);

    const recommendRes = await recommendLogoStyleHandler(postRequest("/api/logo-styles/recommend", { projectId }, cookie));
    const { data: recommendData } = await recommendRes.json();
    const categoryId = recommendData.recommendations[0].category.id as string;

    const selectRes = await selectLogoStyleHandler(
      postRequest("/api/logo-styles/select", { projectId, categoryIds: [categoryId] }, cookie),
    );
    const selectBody = await selectRes.json();

    expect(selectRes.status).toBe(201);
    expect(selectBody.data.selection.primaryCategoryId).toBe(categoryId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("generation");
  });

  it("supports selecting up to 3 categories in 고급 옵션 mode (다중 선택)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(cookie);

    const listRes = await listLogoStylesHandler(new NextRequest("http://localhost/api/logo-styles", { headers: { cookie } }));
    const { data: listData } = await listRes.json();
    const categoryIds = listData.categories.slice(0, 3).map((c: { id: string }) => c.id);

    const res = await selectLogoStyleHandler(
      postRequest("/api/logo-styles/select", { projectId, categoryIds }, cookie),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.selection.categoryIds).toEqual(categoryIds);
  });

  it("rejects more than 3 selected categories (LOGO_STYLE-001)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(cookie);

    const listRes = await listLogoStylesHandler(new NextRequest("http://localhost/api/logo-styles", { headers: { cookie } }));
    const { data: listData } = await listRes.json();
    const categoryIds = listData.categories.map((c: { id: string }) => c.id);
    expect(categoryIds.length).toBeGreaterThan(3);

    const res = await selectLogoStyleHandler(
      postRequest("/api/logo-styles/select", { projectId, categoryIds }, cookie),
    );
    expect(res.status).toBe(400);
  });

  it("blocks Prompt Engine generation until a logo style is selected (PROMPT-001)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(cookie);

    const { POST: createGenerationHandler } = await import("@/app/api/generations/route");
    const res = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    expect(res.status).toBe(409);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithSelectedStrategy(owner.cookie);

    const res = await selectLogoStyleHandler(
      postRequest("/api/logo-styles/select", { projectId, categoryIds: ["any"] }, other.cookie),
    );
    expect(res.status).toBe(404);
  });
});
