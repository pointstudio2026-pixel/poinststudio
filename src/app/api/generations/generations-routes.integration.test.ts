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
import { POST as recommendLogoStyleHandler } from "@/app/api/logo-styles/recommend/route";
import { POST as selectLogoStyleHandler } from "@/app/api/logo-styles/select/route";
import { POST as createGenerationHandler } from "@/app/api/generations/route";
import { GET as getGenerationHistoryHandler } from "@/app/api/generations/[id]/route";
import { POST as retryGenerationHandler } from "@/app/api/generations/[id]/retry/route";
import { GET as getGenerationStatusHandler } from "@/app/api/generations/status/[generationId]/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { FORCE_FAILURE_MARKER } from "@/shared/ai/MockImageGenerationProvider";

const TEST_EMAIL_PREFIX = "task013-route";

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

async function createProjectReadyForGeneration(cookie: string, brandNameOverride?: string) {
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
    const answer = q.key === "brandName" && brandNameOverride ? brandNameOverride : `구체적인 ${q.key} 답변`;
    await saveAnswerHandler(postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer }, cookie));
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

  const recommendLogoRes = await recommendLogoStyleHandler(postRequest("/api/logo-styles/recommend", { projectId }, cookie));
  const { data: recommendLogoData } = await recommendLogoRes.json();
  const logoStyleCategoryId = recommendLogoData.recommendations[0].category.id as string;
  await selectLogoStyleHandler(
    postRequest("/api/logo-styles/select", { projectId, categoryIds: [logoStyleCategoryId] }, cookie),
  );

  return projectId;
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
    if (isTerminal(body.data.generation.status)) {
      return body.data.generation;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for a terminal status on ${generationVersionId}`);
}

describe("Image Generation Pipeline API routes", () => {
  it("processes a generation end-to-end through the real Queue/Worker (정상 생성)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectReadyForGeneration(cookie);

    const createRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    const createBody = await createRes.json();
    expect(createRes.status).toBe(202);
    expect(["pending", "processing"]).toContain(createBody.data.generation.status);

    const finalVersion = await pollStatus(createBody.data.generation.id, cookie, (s) => s === "completed");
    expect(finalVersion.images.length).toBeGreaterThan(0);
    expect(finalVersion.provider).toBe("mock");

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("concept_board");

    const historyRes = await getGenerationHistoryHandler(
      new NextRequest(`http://localhost/api/generations/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    const historyBody = await historyRes.json();
    expect(historyBody.data.versions).toHaveLength(1);
  }, 20000);

  it("marks a generation failed after retries are exhausted, and retry creates a new version (Provider 장애 / 재시도)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectReadyForGeneration(cookie, FORCE_FAILURE_MARKER);

    const createRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    const createBody = await createRes.json();

    const failedVersion = await pollStatus(createBody.data.generation.id, cookie, (s) => s === "failed");
    expect(failedVersion.errorMessage).toBeTruthy();

    const retryRes = await retryGenerationHandler(
      postRequest(`/api/generations/${failedVersion.id}/retry`, {}, cookie),
      { params: Promise.resolve({ id: failedVersion.id }) },
    );
    const retryBody = await retryRes.json();
    expect(retryRes.status).toBe(202);
    expect(retryBody.data.generation.versionNumber).toBe(2);

    const retriedFinal = await pollStatus(retryBody.data.generation.id, cookie, (s) => s !== "pending" && s !== "processing");
    expect(retriedFinal.status).toBe("failed");
  }, 45000);

  it("rejects generation once the plan's monthly limit is reached (구독 한도 초과)", async () => {
    const { userId, cookie } = await createSessionCookie();
    const projectId = await createProjectReadyForGeneration(cookie);

    for (let i = 0; i < PLAN_LIMITS.free.monthlyGenerationLimit; i++) {
      await prisma.usageLog.create({
        data: { userId, eventType: GENERATION_EVENT_TYPE, quantity: 1 },
      });
    }

    const res = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    expect(res.status).toBe(429);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectReadyForGeneration(owner.cookie);

    const res = await getGenerationHistoryHandler(
      new NextRequest(`http://localhost/api/generations/${projectId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
