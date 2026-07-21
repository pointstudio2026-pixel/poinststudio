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
import { POST as buildPromptHandler } from "@/app/api/prompts/build/route";
import { POST as generateConceptBoardHandler } from "@/app/api/concept-board/generate/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task022-deliverable-type";

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

describe("Non-branding deliverable type flow (포스터)", () => {
  it("skips brand_strategy/logo_style entirely and still generates a prompt + concept board via fallback data", async () => {
    const { cookie } = await createSessionCookie();

    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Poster Project" }, cookie));
    const { data } = await createRes.json();
    const projectId = data.projectId as string;

    const project0 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project0?.currentStep).toBe("deliverable_type");

    const selectTypeRes = await selectDeliverableTypeHandler(
      postRequest(`/api/projects/${projectId}/deliverable-type`, { deliverableType: "포스터" }, cookie),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(selectTypeRes.status).toBe(201);
    const project1 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project1?.currentStep).toBe("brand_interview");

    // 포스터 전용 질문(posterContext)이 인터뷰 질문 목록에 나타나야 한다.
    const interviewRes = await getInterviewHandler(
      new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const interviewBody = await interviewRes.json();
    expect(interviewBody.data.questions.map((q: { key: string }) => q.key)).toContain("posterContext");

    for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
      await saveAnswerHandler(
        postRequest("/api/interview/answer", { projectId, questionKey: q.key, answer: `구체적인 ${q.key} 답변` }, cookie),
      );
    }
    await saveAnswerHandler(
      postRequest("/api/interview/answer", { projectId, questionKey: "posterContext", answer: "지역 재즈 페스티벌 홍보" }, cookie),
    );
    await completeInterviewHandler(postRequest("/api/interview/complete", { projectId }, cookie));

    const project2 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project2?.currentStep).toBe("style");

    const recommendRes = await recommendStylesHandler(postRequest("/api/styles/recommend", { projectId }, cookie));
    const { data: recommendData } = await recommendRes.json();
    const styleId = recommendData.recommendations[0].style.id as string;

    const selectStyleRes = await selectStyleHandler(
      postRequest("/api/styles/select", { projectId, primaryStyleId: styleId, secondaryStyleIds: [] }, cookie),
    );
    expect(selectStyleRes.status).toBe(201);

    // 스타일 선택 직후 "브랜드 전략"/"로고 스타일"을 건너뛰고 곧장 이미지 생성으로 전진한다.
    const project3 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project3?.currentStep).toBe("generation");

    // Brand Strategy/Logo Style 단계 없이도 Prompt Engine이 폴백 데이터로 성공한다.
    const promptRes = await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, cookie));
    const promptBody = await promptRes.json();
    expect(promptRes.status).toBe(201);
    expect(promptBody.data.prompt.currentVersion.userPrompt).not.toContain("로고 구조");

    const boardRes = await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, cookie));
    expect(boardRes.status).toBe(201);
  });
});
