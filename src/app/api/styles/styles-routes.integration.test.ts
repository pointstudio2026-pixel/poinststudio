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
import { GET as listStylesHandler } from "@/app/api/styles/route";
import { POST as recommendStylesHandler } from "@/app/api/styles/recommend/route";
import { POST as selectStyleHandler } from "@/app/api/styles/select/route";
import { GET as getStyleHistoryHandler } from "@/app/api/styles/history/[projectId]/route";
import { POST as favoriteStyleHandler } from "@/app/api/styles/favorite/route";
import { GET as getFavoritesHandler } from "@/app/api/styles/favorites/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task011-route";

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

  return projectId;
}

describe("Style Engine API routes", () => {
  it("lists seeded styles and category tree (GET /styles)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await listStylesHandler(
      new NextRequest("http://localhost/api/styles?category=미니멀", { headers: { cookie } }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.styles.length).toBeGreaterThan(0);
    expect(body.data.categories.length).toBeGreaterThanOrEqual(8);
    expect(body.data.styles.every((s: { category: string }) => s.category === "미니멀")).toBe(true);
  });

  it("recommends styles from completed Interview answers (정상 분석)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(cookie);

    const res = await recommendStylesHandler(postRequest("/api/styles/recommend", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.recommendations.length).toBeGreaterThan(0);
    expect(body.data.recommendations.length).toBeLessThanOrEqual(6);
    expect(body.data.recommendations[0].reason).toBeTruthy();
  });

  it("rejects recommendation before the Interview is completed", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
    const { data } = await createRes.json();

    const res = await recommendStylesHandler(
      postRequest("/api/styles/recommend", { projectId: data.projectId }, cookie),
    );
    expect(res.status).toBe(409);
  });

  it("selects a style, advances the project, and records history (정상 선택 / 재선택)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(cookie);

    const recommendRes = await recommendStylesHandler(
      postRequest("/api/styles/recommend", { projectId }, cookie),
    );
    const { data: recommendData } = await recommendRes.json();
    const styleId = recommendData.recommendations[0].style.id as string;

    const selectRes = await selectStyleHandler(
      postRequest("/api/styles/select", { projectId, primaryStyleId: styleId, secondaryStyleIds: [] }, cookie),
    );
    expect(selectRes.status).toBe(201);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("brand_strategy");

    // 재선택 -> 히스토리에 2건 남는다.
    await selectStyleHandler(
      postRequest("/api/styles/select", { projectId, primaryStyleId: styleId, secondaryStyleIds: [] }, cookie),
    );

    const historyRes = await getStyleHistoryHandler(
      new NextRequest(`http://localhost/api/styles/history/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const historyBody = await historyRes.json();
    expect(historyBody.data.history).toHaveLength(2);
  });

  it("rejects a conflicting Primary/Secondary combination (STYLE-002)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(cookie);

    const minimalRes = await listStylesHandler(
      new NextRequest("http://localhost/api/styles?category=미니멀", { headers: { cookie } }),
    );
    const playfulRes = await listStylesHandler(
      new NextRequest("http://localhost/api/styles?category=플레이풀", { headers: { cookie } }),
    );
    const minimal = (await minimalRes.json()).data.styles[0];
    const playful = (await playfulRes.json()).data.styles[0];

    const res = await selectStyleHandler(
      postRequest(
        "/api/styles/select",
        { projectId, primaryStyleId: minimal.id, secondaryStyleIds: [playful.id] },
        cookie,
      ),
    );
    expect(res.status).toBe(400);
  });

  it("supports favoriting and listing favorite styles (즐겨찾기)", async () => {
    const { cookie } = await createSessionCookie();
    const listRes = await listStylesHandler(
      new NextRequest("http://localhost/api/styles?category=테크", { headers: { cookie } }),
    );
    const style = (await listRes.json()).data.styles[0];

    await favoriteStyleHandler(postRequest("/api/styles/favorite", { styleId: style.id, favorite: true }, cookie));
    const favRes = await getFavoritesHandler(
      new NextRequest("http://localhost/api/styles/favorites", { headers: { cookie } }),
    );
    const favBody = await favRes.json();
    expect(favBody.data.styles.some((s: { id: string }) => s.id === style.id)).toBe(true);

    await favoriteStyleHandler(postRequest("/api/styles/favorite", { styleId: style.id, favorite: false }, cookie));
    const favRes2 = await getFavoritesHandler(
      new NextRequest("http://localhost/api/styles/favorites", { headers: { cookie } }),
    );
    const favBody2 = await favRes2.json();
    expect(favBody2.data.styles.some((s: { id: string }) => s.id === style.id)).toBe(false);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithCompletedInterview(owner.cookie);

    const res = await getStyleHistoryHandler(
      new NextRequest(`http://localhost/api/styles/history/${projectId}`, {
        headers: { cookie: other.cookie },
      }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
