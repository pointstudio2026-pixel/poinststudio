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
import { POST as favoriteStyleHandler } from "@/app/api/styles/favorite/route";
import { GET as getDesignMemoryHandler } from "@/app/api/design-memory/route";
import { POST as resetDesignMemoryHandler } from "@/app/api/design-memory/reset/route";
import { PATCH as patchDesignMemorySettingsHandler } from "@/app/api/design-memory/settings/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task018-route";

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

  return { projectId, styleId };
}

describe("Design Memory API routes", () => {
  it("returns an empty profile for a brand-new user (신규 사용자)", async () => {
    const { cookie } = await createSessionCookie();
    const res = await getDesignMemoryHandler(new NextRequest("http://localhost/api/design-memory", { headers: { cookie } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.profile.enabled).toBe(true);
    expect(body.data.profile.signalCount).toBe(0);
  });

  it("reflects style selections and favorites after real project activity (프로젝트 완료 후 업데이트 / 즐겨찾기 반영)", async () => {
    const { cookie } = await createSessionCookie();
    const { styleId } = await createProjectWithStyleSelected(cookie);
    await favoriteStyleHandler(postRequest("/api/styles/favorite", { styleId, favorite: true }, cookie));

    const res = await getDesignMemoryHandler(new NextRequest("http://localhost/api/design-memory", { headers: { cookie } }));
    const body = await res.json();

    expect(body.data.profile.topStyles.some((s: { style: { id: string } }) => s.style.id === styleId)).toBe(true);
    expect(body.data.profile.favoriteStyles.some((s: { id: string }) => s.id === styleId)).toBe(true);
    expect(body.data.profile.topIndustries.length).toBeGreaterThan(0);
    expect(body.data.profile.signalCount).toBeGreaterThan(0);
  });

  it("stops surfacing signals after a reset without deleting the underlying project data (메모리 초기화)", async () => {
    const { cookie } = await createSessionCookie();
    const { projectId, styleId } = await createProjectWithStyleSelected(cookie);

    const beforeReset = await getDesignMemoryHandler(
      new NextRequest("http://localhost/api/design-memory", { headers: { cookie } }),
    );
    expect((await beforeReset.json()).data.profile.topStyles.length).toBeGreaterThan(0);

    const resetRes = await resetDesignMemoryHandler(postRequest("/api/design-memory/reset", {}, cookie));
    expect(resetRes.status).toBe(200);

    const afterReset = await getDesignMemoryHandler(
      new NextRequest("http://localhost/api/design-memory", { headers: { cookie } }),
    );
    expect((await afterReset.json()).data.profile.topStyles).toHaveLength(0);

    // The underlying style_selections row (and the project itself) must
    // still exist -- reset only shifts Design Memory's own cutoff.
    const selection = await prisma.styleSelection.findFirst({ where: { projectId, primaryStyleId: styleId } });
    expect(selection).not.toBeNull();
  });

  it("stops surfacing recommendations once disabled (비활성화)", async () => {
    const { cookie } = await createSessionCookie();
    await createProjectWithStyleSelected(cookie);

    const disableRes = await patchDesignMemorySettingsHandler(
      postRequest("/api/design-memory/settings", { enabled: false }, cookie),
    );
    expect((await disableRes.json()).data.settings.enabled).toBe(false);

    const res = await getDesignMemoryHandler(new NextRequest("http://localhost/api/design-memory", { headers: { cookie } }));
    const body = await res.json();
    expect(body.data.profile.enabled).toBe(false);
    expect(body.data.profile.topStyles).toEqual([]);
  });

  it("only surfaces the requesting user's own signals (권한 검증)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const { styleId } = await createProjectWithStyleSelected(owner.cookie);

    const otherRes = await getDesignMemoryHandler(
      new NextRequest("http://localhost/api/design-memory", { headers: { cookie: other.cookie } }),
    );
    const otherBody = await otherRes.json();
    expect(otherBody.data.profile.topStyles.some((s: { style: { id: string } }) => s.style.id === styleId)).toBe(
      false,
    );
  });
});
