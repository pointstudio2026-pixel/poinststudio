import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { GET as getInterviewHandler } from "@/app/api/interview/[projectId]/route";
import { POST as saveAnswerHandler } from "@/app/api/interview/answer/route";
import { POST as completeInterviewHandler } from "@/app/api/interview/complete/route";
import { POST as generateBriefHandler } from "@/app/api/brand-brief/generate/route";
import { POST as executeAsterBrainHandler } from "@/app/api/aster-brain/execute/route";
import { GET as listStylesHandler } from "@/app/api/styles/route";
import { POST as selectStyleHandler } from "@/app/api/styles/select/route";
import { POST as createGenerationHandler } from "@/app/api/generations/route";
import { GET as getGenerationStatusHandler } from "@/app/api/generations/status/[generationId]/route";
import { GET as getTemplatesHandler } from "@/app/api/mockups/templates/route";
import { POST as renderMockupHandler } from "@/app/api/mockups/render/route";
import { GET as getMockupsHandler, DELETE as deleteMockupHandler } from "@/app/api/mockups/[id]/route";
import { POST as favoriteMockupHandler } from "@/app/api/mockups/favorite/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { FORCE_FAILURE_MARKER } from "@/shared/ai/MockMockupRenderProvider";

const TEST_EMAIL_PREFIX = "task016-route";

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

function postRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function pollStatus(
  generationVersionId: string,
  cookie: string,
  isTerminal: (status: string) => boolean,
  timeoutMs = 15000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await getGenerationStatusHandler(
      new NextRequest(`http://localhost/api/generations/status/${generationVersionId}`, { headers: { cookie } }),
      { params: Promise.resolve({ generationId: generationVersionId }) },
    );
    const body = await res.json();
    if (isTerminal(body.data.generation.status)) return body.data.generation;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for a terminal status on ${generationVersionId}`);
}

async function createProjectWithCompletedGeneration(cookie: string) {
  const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
  const { data } = await createRes.json();
  const projectId = data.projectId as string;

  await getInterviewHandler(
    new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
    { params: Promise.resolve({ projectId }) },
  );
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswerHandler(postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer: `구체적인 ${q.key} 답변` }, cookie));
  }
  await completeInterviewHandler(postRequest("/api/interview/complete", { projectId }, cookie));
  await generateBriefHandler(postRequest("/api/brand-brief/generate", { projectId }, cookie));
  await executeAsterBrainHandler(postRequest("/api/aster-brain/execute", { projectId }, cookie));

  const stylesRes = await listStylesHandler(
    new NextRequest("http://localhost/api/styles?category=Minimal", { headers: { cookie } }),
  );
  const styleId = (await stylesRes.json()).data.styles[0].id as string;
  await selectStyleHandler(
    postRequest("/api/styles/select", { projectId, primaryStyleId: styleId, secondaryStyleIds: [] }, cookie),
  );

  const createGenRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
  const createGenBody = await createGenRes.json();
  const completedVersion = await pollStatus(createGenBody.data.generation.id, cookie, (s) => s === "completed");

  return { projectId, sourceVersion: completedVersion };
}

describe("Mockup Studio API routes", () => {
  it("lists seeded templates with a category filter", async () => {
    const { cookie } = await createSessionCookie();
    const res = await getTemplatesHandler(
      new NextRequest("http://localhost/api/mockups/templates?category=business_card", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.templates.length).toBeGreaterThan(0);
    expect(body.data.templates.every((t: { category: string }) => t.category === "business_card")).toBe(true);
    expect(body.data.categories.length).toBeGreaterThanOrEqual(10);
  });

  it("renders a mockup end-to-end through the real Queue/Worker (Mockup 생성 성공 / Queue 기반 렌더링)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const templatesRes = await getTemplatesHandler(
      new NextRequest("http://localhost/api/mockups/templates?category=coffee_cup", { headers: { cookie } }),
    );
    const template = (await templatesRes.json()).data.templates[0];

    const renderRes = await renderMockupHandler(
      postRequest(
        "/api/mockups/render",
        { projectId, generationVersionId: sourceVersion.id, sourceImageIndex: 0, templateId: template.id },
        cookie,
      ),
    );
    const renderBody = await renderRes.json();
    expect(renderRes.status).toBe(202);

    const finalMockup = await pollStatusMockup(projectId, renderBody.data.mockup.id, cookie);
    expect(finalMockup.status).toBe("completed");
    expect(finalMockup.resultImageUrl).toBeTruthy();
    expect(finalMockup.provider).toBe("mock");
  }, 20000);

  it("supports favoriting and deleting a mockup, and filters by category (즐겨찾기 / 프로젝트 연결)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);
    const templatesRes = await getTemplatesHandler(
      new NextRequest("http://localhost/api/mockups/templates?category=t_shirt", { headers: { cookie } }),
    );
    const template = (await templatesRes.json()).data.templates[0];

    const renderRes = await renderMockupHandler(
      postRequest(
        "/api/mockups/render",
        { projectId, generationVersionId: sourceVersion.id, sourceImageIndex: 0, templateId: template.id },
        cookie,
      ),
    );
    const mockupId = (await renderRes.json()).data.mockup.id as string;
    await pollStatusMockup(projectId, mockupId, cookie);

    const favRes = await favoriteMockupHandler(postRequest("/api/mockups/favorite", { mockupId, favorite: true }, cookie));
    expect((await favRes.json()).data.mockup.isFavorite).toBe(true);

    const listRes = await getMockupsHandler(
      new NextRequest(`http://localhost/api/mockups/${projectId}?category=t_shirt`, { headers: { cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect((await listRes.json()).data.mockups).toHaveLength(1);

    const emptyRes = await getMockupsHandler(
      new NextRequest(`http://localhost/api/mockups/${projectId}?category=packaging`, { headers: { cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect((await emptyRes.json()).data.mockups).toHaveLength(0);

    const deleteRes = await deleteMockupHandler(
      new NextRequest(`http://localhost/api/mockups/${mockupId}`, { method: "DELETE", headers: { cookie } }),
      { params: Promise.resolve({ id: mockupId }) },
    );
    expect(deleteRes.status).toBe(200);
  }, 20000);

  it("marks a mockup failed after retries are exhausted (렌더 실패 재시도)", async () => {
    const { userId, cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const failingTemplate = await prisma.mockupTemplate.create({
      data: {
        category: "business_card",
        name: FORCE_FAILURE_MARKER,
        slug: `force-fail-${Date.now()}`,
        description: "test-only failing template",
        backgroundUrl: "data:image/svg+xml;base64,AAA",
        placementXPct: 0,
        placementYPct: 0,
        placementWidthPct: 100,
        placementHeightPct: 100,
      },
    });

    const renderRes = await renderMockupHandler(
      postRequest(
        "/api/mockups/render",
        { projectId, generationVersionId: sourceVersion.id, sourceImageIndex: 0, templateId: failingTemplate.id },
        cookie,
      ),
    );
    const mockupId = (await renderRes.json()).data.mockup.id as string;
    const finalMockup = await pollStatusMockup(projectId, mockupId, cookie, (s) => s === "failed");
    expect(finalMockup.errorMessage).toBeTruthy();

    // Delete the referencing user/project (cascades away the mockup_project
    // row) before removing the test-only template, or the FK constraint
    // on mockup_projects.template_id blocks the delete.
    await prisma.user.delete({ where: { id: userId } });
    await prisma.mockupTemplate.delete({ where: { id: failingTemplate.id } });
  }, 20000);

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const { projectId } = await createProjectWithCompletedGeneration(owner.cookie);

    const res = await getMockupsHandler(
      new NextRequest(`http://localhost/api/mockups/${projectId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(res.status).toBe(404);
  });
});

async function pollStatusMockup(
  projectId: string,
  mockupId: string,
  cookie: string,
  isTerminal: (status: string) => boolean = (s) => s === "completed" || s === "failed",
  timeoutMs = 15000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await getMockupsHandler(
      new NextRequest(`http://localhost/api/mockups/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    const body = await res.json();
    const mockup = body.data.mockups.find((m: { id: string }) => m.id === mockupId);
    if (mockup && isTerminal(mockup.status)) return mockup;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for a terminal status on mockup ${mockupId}`);
}
