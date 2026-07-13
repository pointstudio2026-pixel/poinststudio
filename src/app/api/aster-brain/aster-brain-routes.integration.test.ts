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
import { POST as rebuildAsterBrainHandler } from "@/app/api/aster-brain/rebuild/route";
import { GET as getAsterBrainHandler } from "@/app/api/aster-brain/[projectId]/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task010-route";

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

async function createProjectWithBrandBrief(cookie: string) {
  const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Brand" }, cookie));
  const { data } = await createRes.json();
  const projectId = data.projectId as string;

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
  await generateBriefHandler(postRequest("/api/brand-brief/generate", { projectId }, cookie));

  return projectId;
}

describe("Aster Brain API routes", () => {
  it("executes analysis after a Brand Brief exists (정상 분석)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithBrandBrief(cookie);

    const res = await executeAsterBrainHandler(postRequest("/api/aster-brain/execute", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.strategy.currentVersion.versionNumber).toBe(1);
    expect(body.data.strategy.currentVersion.data.brandKnowledge.mission).toBeTruthy();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("style");
  });

  it("rejects analysis before a Brand Brief exists (Brand Brief 누락)", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Brand" }, cookie));
    const { data } = await createRes.json();

    const res = await executeAsterBrainHandler(
      postRequest("/api/aster-brain/execute", { projectId: data.projectId }, cookie),
    );
    expect(res.status).toBe(409);
  });

  it("rebuild always creates a new version (재분석)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithBrandBrief(cookie);
    await executeAsterBrainHandler(postRequest("/api/aster-brain/execute", { projectId }, cookie));

    const rebuildRes = await rebuildAsterBrainHandler(
      postRequest("/api/aster-brain/rebuild", { projectId }, cookie),
    );
    const rebuildBody = await rebuildRes.json();
    expect(rebuildBody.data.strategy.currentVersion.versionNumber).toBe(2);

    const getRes = await getAsterBrainHandler(
      new NextRequest(`http://localhost/api/aster-brain/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const getBody = await getRes.json();
    expect(getBody.data.versions).toHaveLength(2);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithBrandBrief(owner.cookie);
    await executeAsterBrainHandler(postRequest("/api/aster-brain/execute", { projectId }, owner.cookie));

    const res = await getAsterBrainHandler(
      new NextRequest(`http://localhost/api/aster-brain/${projectId}`, {
        headers: { cookie: other.cookie },
      }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
