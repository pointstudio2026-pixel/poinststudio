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
import { POST as buildPromptHandler } from "@/app/api/prompts/build/route";
import { GET as getPromptHandler } from "@/app/api/prompts/[projectId]/route";
import { GET as getPromptVersionsHandler } from "@/app/api/prompts/[projectId]/versions/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task012-route";

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

async function createProjectWithStyleSelected(cookie: string) {
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

  const recommendLogoRes = await recommendLogoStyleHandler(postRequest("/api/logo-styles/recommend", { projectId }, cookie));
  const { data: recommendLogoData } = await recommendLogoRes.json();
  const logoStyleCategoryId = recommendLogoData.recommendations[0].category.id as string;
  await selectLogoStyleHandler(
    postRequest("/api/logo-styles/select", { projectId, categoryIds: [logoStyleCategoryId] }, cookie),
  );

  return projectId;
}

describe("Prompt Engine API routes", () => {
  it("blocks building until Interview/Strategy selection/Style are all in place (PROMPT-001)", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
    const { data } = await createRes.json();

    const res = await buildPromptHandler(postRequest("/api/prompts/build", { projectId: data.projectId }, cookie));
    expect(res.status).toBe(409);
  });

  it("builds a prompt, separates system/user text, and applies the safety layer (정상 생성)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStyleSelected(cookie);

    const res = await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.prompt.currentVersion.versionNumber).toBe(1);
    expect(body.data.prompt.currentVersion.systemPrompt).toContain("모방하지 않는다");
    expect(body.data.prompt.currentVersion.userPrompt).toBeTruthy();
    expect(body.data.prompt.currentVersion.hash).toHaveLength(64);
  });

  it("reproduces the same hash on rebuild and keeps full version history (재현성 / Version 비교)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStyleSelected(cookie);

    const first = await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, cookie));
    const firstBody = await first.json();

    const second = await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, cookie));
    const secondBody = await second.json();

    expect(secondBody.data.prompt.currentVersion.versionNumber).toBe(2);
    expect(secondBody.data.prompt.currentVersion.hash).toBe(firstBody.data.prompt.currentVersion.hash);

    const versionsRes = await getPromptVersionsHandler(
      new NextRequest(`http://localhost/api/prompts/${projectId}/versions`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const versionsBody = await versionsRes.json();
    expect(versionsBody.data.versions).toHaveLength(2);
  });

  it("produces a different payload/hash per provider (Provider 변경)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStyleSelected(cookie);

    const openaiRes = await buildPromptHandler(
      postRequest("/api/prompts/build", { projectId, provider: "gemini" }, cookie),
    );
    const openaiBody = await openaiRes.json();
    expect(openaiBody.data.prompt.currentVersion.provider).toBe("gemini");
    expect(openaiBody.data.prompt.currentVersion.payload.model).toContain("gemini");
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithStyleSelected(owner.cookie);
    await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, owner.cookie));

    const res = await getPromptHandler(
      new NextRequest(`http://localhost/api/prompts/${projectId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
