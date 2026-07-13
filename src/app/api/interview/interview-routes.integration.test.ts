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
import { POST as completeHandler } from "@/app/api/interview/complete/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task007-route";

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

async function createProject(cookie: string) {
  const res = await createProjectHandler(
    new NextRequest("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Brand" }),
    }),
  );
  const { data } = await res.json();
  return data.projectId as string;
}

function postRequest(path: string, body: unknown, cookie: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

describe("Interview API routes", () => {
  it("starts, answers, and completes an interview end-to-end", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie);

    const startRes = await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const startBody = await startRes.json();
    expect(startRes.status).toBe(200);
    expect(startBody.data.interview.status).toBe("in_progress");

    for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
      const res = await saveAnswerHandler(
        postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer: "test answer" }, cookie),
      );
      expect(res.status).toBe(200);
    }

    const completeRes = await completeHandler(postRequest("/api/interview/complete", { projectId }, cookie));
    const completeBody = await completeRes.json();
    expect(completeRes.status).toBe(200);
    expect(completeBody.data.interview.status).toBe("completed");

    // 완료 후 재진입: GET은 완료 상태를 그대로 보여준다.
    const reEntryRes = await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const reEntryBody = await reEntryRes.json();
    expect(reEntryBody.data.interview.status).toBe("completed");

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("brand_brief");
  });

  it("blocks a required-question completion attempt with missing answers", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie);
    await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );

    const res = await completeHandler(postRequest("/api/interview/complete", { projectId }, cookie));
    expect(res.status).toBe(400);
  });

  it("rejects access to another user's interview", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProject(owner.cookie);

    const res = await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, {
        headers: { cookie: other.cookie },
      }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
