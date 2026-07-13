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
import { GET as getBriefHandler, PATCH as patchBriefHandler } from "@/app/api/brand-brief/[projectId]/route";
import { POST as restoreBriefHandler } from "@/app/api/brand-brief/[projectId]/restore/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task009-route";

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

async function createProjectWithCompletedInterview(cookie: string) {
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

  return projectId;
}

describe("Brand Brief API routes", () => {
  it("generates a Brand Brief after the interview is completed (정상 생성)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(cookie);

    const res = await generateBriefHandler(postRequest("/api/brand-brief/generate", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.brief.currentVersion.versionNumber).toBe(1);
    expect(body.data.brief.currentVersion.data.brandName).toBeTruthy();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("brand_strategy");
  });

  it("rejects generation before the interview is completed (인터뷰 정보 부족)", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Brand" }, cookie));
    const { data } = await createRes.json();

    const res = await generateBriefHandler(
      postRequest("/api/brand-brief/generate", { projectId: data.projectId }, cookie),
    );
    expect(res.status).toBe(409);
  });

  it("supports edit -> new version and restoring an earlier version", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(cookie);
    await generateBriefHandler(postRequest("/api/brand-brief/generate", { projectId }, cookie));

    const patchRes = await patchBriefHandler(
      postRequest(`/api/brand-brief/${projectId}`, { tagline: "새로운 태그라인" }, cookie),
      { params: Promise.resolve({ projectId }) },
    );
    const patchBody = await patchRes.json();
    expect(patchBody.data.brief.currentVersion.versionNumber).toBe(2);
    expect(patchBody.data.brief.currentVersion.source).toBe("user");

    const restoreRes = await restoreBriefHandler(
      postRequest(`/api/brand-brief/${projectId}/restore`, { versionNumber: 1 }, cookie),
      { params: Promise.resolve({ projectId }) },
    );
    const restoreBody = await restoreRes.json();
    expect(restoreRes.status).toBe(200);
    expect(restoreBody.data.brief.currentVersion.versionNumber).toBe(3);
    expect(restoreBody.data.brief.currentVersion.data.tagline).not.toBe("새로운 태그라인");

    const getRes = await getBriefHandler(
      new NextRequest(`http://localhost/api/brand-brief/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const getBody = await getRes.json();
    expect(getBody.data.versions).toHaveLength(3);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(owner.cookie);
    await generateBriefHandler(postRequest("/api/brand-brief/generate", { projectId }, owner.cookie));

    const res = await getBriefHandler(
      new NextRequest(`http://localhost/api/brand-brief/${projectId}`, {
        headers: { cookie: other.cookie },
      }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
