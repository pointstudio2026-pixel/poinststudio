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
import { POST as completeHandler } from "@/app/api/interview/complete/route";
import { POST as followUpHandler } from "@/app/api/interview/follow-up/route";
import { INTERVIEW_QUESTIONS, OTHER_ANSWER_PREFIX } from "@/modules/interviews/domain/interviewQuestions";

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

function postRequest(path: string, body: unknown, cookie: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
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
  const projectId = data.projectId as string;

  await selectDeliverableTypeHandler(
    postRequest(`/api/projects/${projectId}/deliverable-type`, { deliverableType: "브랜딩 & 로고" }, cookie),
    { params: Promise.resolve({ id: projectId }) },
  );

  return projectId;
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
    expect(project?.currentStep).toBe("style");
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

  it("unlocks industry-specific questions once industry is answered (카페 업종)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie);
    await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );

    const res = await saveAnswerHandler(
      postRequest("/api/interview/answer", { projectId, questionKey: "industry", answer: "동네 카페" }, cookie),
    );
    const body = await res.json();

    expect(body.data.questions.map((q: { key: string }) => q.key)).toContain("cafeAtmosphere");
  });

  it("generates an AI follow-up (mock provider) for a weak answer and blocks completion until it's answered", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProject(cookie);
    await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );

    // select+allowOther 질문은 "기타(직접 입력)" 모드로 답해야 findWeakAnswer가
    // 검사 대상으로 본다 -- 닫힌 보기를 그대로 고른 답변은 아무리 짧아도 검사하지 않는다.
    for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
      const answer = q.allowOther ? `${OTHER_ANSWER_PREFIX}짧음` : "짧음";
      await saveAnswerHandler(
        postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer }, cookie),
      );
    }

    const followUpRes = await followUpHandler(postRequest("/api/interview/follow-up", { projectId }, cookie));
    const followUpBody = await followUpRes.json();
    expect(followUpRes.status).toBe(200);
    expect(followUpBody.data.followUpGenerated).toBe(true);

    const followUpKey = followUpBody.data.questions.at(-1).key as string;
    expect(followUpKey).toMatch(/^followUp_/);

    // Still missing the follow-up's own answer.
    const tooSoon = await completeHandler(postRequest("/api/interview/complete", { projectId }, cookie));
    expect(tooSoon.status).toBe(400);

    await saveAnswerHandler(
      postRequest(
        "/api/interview/answer",
        { projectId, questionKey: followUpKey, answer: "충분히 구체적인 후속 답변입니다." },
        cookie,
      ),
    );

    const completeRes = await completeHandler(postRequest("/api/interview/complete", { projectId }, cookie));
    expect(completeRes.status).toBe(200);
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
