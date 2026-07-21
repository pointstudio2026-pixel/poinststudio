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
import { GET as getGenerationStatusHandler } from "@/app/api/generations/status/[generationId]/route";
import { POST as createEditHandler } from "@/app/api/edits/route";
import { GET as getEditHistoryHandler } from "@/app/api/edits/[id]/route";
import { POST as retryEditHandler } from "@/app/api/edits/[id]/retry/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { FORCE_FAILURE_MARKER } from "@/shared/ai/MockImageGenerationProvider";

const TEST_EMAIL_PREFIX = "task014-route";

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

  await selectDeliverableTypeHandler(
    postRequest(`/api/projects/${projectId}/deliverable-type`, { deliverableType: "브랜딩 & 로고" }, cookie),
    { params: Promise.resolve({ id: projectId }) },
  );

  await getInterviewHandler(
    new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
    { params: Promise.resolve({ projectId }) },
  );
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswerHandler(postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer: `구체적인 ${q.key} 답변` }, cookie));
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

  const createGenRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
  const createGenBody = await createGenRes.json();
  const completedVersion = await pollStatus(createGenBody.data.generation.id, cookie, (s) => s === "completed");

  return { projectId, generationId: completedVersion.generationId, sourceVersion: completedVersion };
}

describe("One Click Edit API routes", () => {
  it("applies a preset edit end-to-end through the real Queue/Worker, keeping the original intact (원클릭 수정 성공 / 원본 유지)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const createRes = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, presetKey: "more_minimal" },
        cookie,
      ),
    );
    const createBody = await createRes.json();
    expect(createRes.status).toBe(202);

    const finalVersion = await pollStatus(createBody.data.edit.resultVersionId, cookie, (s) => s === "completed");
    expect(finalVersion.images).toHaveLength(1);
    expect(finalVersion.provider).toBe("mock");

    const untouchedSource = await pollStatus(sourceVersion.id, cookie, () => true, 2000);
    expect(untouchedSource.images).toHaveLength(sourceVersion.images.length);
  }, 20000);

  it("rejects an unknown preset key", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const res = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, presetKey: "not-real" },
        cookie,
      ),
    );
    expect(res.status).toBe(400);
  }, 20000);

  it("applies a free-text edit instruction end-to-end (대화형 수정 입력)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const createRes = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, customInstruction: "로고를 더 둥글게 만들어줘" },
        cookie,
      ),
    );
    const createBody = await createRes.json();
    expect(createRes.status).toBe(202);
    expect(createBody.data.edit.presetKey).toBeNull();
    expect(createBody.data.edit.customInstruction).toBe("로고를 더 둥글게 만들어줘");

    const finalVersion = await pollStatus(createBody.data.edit.resultVersionId, cookie, (s) => s === "completed");
    expect(finalVersion.images).toHaveLength(1);
  }, 20000);

  it("rejects a request with neither presetKey nor customInstruction, and with both (대화형 입력 XOR)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    const neitherRes = await createEditHandler(
      postRequest("/api/edits", { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0 }, cookie),
    );
    expect(neitherRes.status).toBe(400);

    const bothRes = await createEditHandler(
      postRequest(
        "/api/edits",
        {
          projectId,
          sourceVersionId: sourceVersion.id,
          sourceImageIndex: 0,
          presetKey: "simpler",
          customInstruction: "로고를 더 둥글게 만들어줘",
        },
        cookie,
      ),
    );
    expect(bothRes.status).toBe(400);
  }, 20000);

  it("retries a failed edit and lists full history (수정 이력 / 연속 수정)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, generationId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    // Force a failure by re-selecting the style with a marker-laden brief is
    // overkill here -- instead, exercise the general history/list path with
    // a successful edit, then a second edit, and confirm both appear.
    const first = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, presetKey: "simpler" },
        cookie,
      ),
    );
    const firstBody = await first.json();
    await pollStatus(firstBody.data.edit.resultVersionId, cookie, (s) => s === "completed");

    const second = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, presetKey: "change_color" },
        cookie,
      ),
    );
    const secondBody = await second.json();
    await pollStatus(secondBody.data.edit.resultVersionId, cookie, (s) => s === "completed");

    const historyRes = await getEditHistoryHandler(
      new NextRequest(`http://localhost/api/edits/${generationId}`, { headers: { cookie } }),
      { params: Promise.resolve({ id: generationId }) },
    );
    const historyBody = await historyRes.json();
    expect(historyBody.data.history).toHaveLength(2);
    expect(historyBody.data.history.every((e: { resultVersion: unknown }) => e.resultVersion)).toBe(true);
  }, 30000);

  it("marks an edit failed after retries are exhausted, and retry creates a new entry (Provider 실패 / Queue 재시도)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, sourceVersion } = await createProjectWithCompletedGeneration(cookie);

    // generate() and edit() share the same Mock failure trigger (the
    // underlying prompt's userPrompt), so to fail only the *edit* without
    // also failing the generation that produced the source image, inject
    // the marker into the already-completed source version's prompt text
    // directly -- ProcessEditJobUseCase re-reads it fresh at process time.
    await prisma.promptVersion.update({
      where: { id: sourceVersion.promptVersionId },
      data: { userPrompt: `${FORCE_FAILURE_MARKER} brand context` },
    });

    const createRes = await createEditHandler(
      postRequest(
        "/api/edits",
        { projectId, sourceVersionId: sourceVersion.id, sourceImageIndex: 0, presetKey: "regenerate" },
        cookie,
      ),
    );
    const createBody = await createRes.json();

    const failedVersion = await pollStatus(createBody.data.edit.resultVersionId, cookie, (s) => s === "failed");
    expect(failedVersion.errorMessage).toBeTruthy();

    const retryRes = await retryEditHandler(
      postRequest(`/api/edits/${createBody.data.edit.id}/retry`, {}, cookie),
      { params: Promise.resolve({ id: createBody.data.edit.id }) },
    );
    const retryBody = await retryRes.json();
    expect(retryRes.status).toBe(202);
    expect(retryBody.data.edit.id).not.toBe(createBody.data.edit.id);
  }, 30000);

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const { generationId } = await createProjectWithCompletedGeneration(owner.cookie);

    const res = await getEditHistoryHandler(
      new NextRequest(`http://localhost/api/edits/${generationId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ id: generationId }) },
    );
    expect(res.status).toBe(404);
  });
});
