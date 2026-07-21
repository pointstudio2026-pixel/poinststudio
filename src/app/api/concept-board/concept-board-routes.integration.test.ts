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
import { POST as generateConceptBoardHandler } from "@/app/api/concept-board/generate/route";
import { GET as getConceptBoardHandler, PATCH as patchConceptBoardHandler } from "@/app/api/concept-board/[projectId]/route";
import { POST as restoreConceptBoardHandler } from "@/app/api/concept-board/[projectId]/restore/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task015-route";

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

async function createProjectWithStrategy(cookie: string) {
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

  return projectId;
}

describe("Concept Board API routes", () => {
  it("generates a board without any generated images yet (자동 생성 / 이미지 없음)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStrategy(cookie);

    const res = await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, cookie));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.board.currentVersion.data.heroImageUrl).toBeNull();
    expect(body.data.board.currentVersion.data.brandSummary).toBeTruthy();
  });

  it("rejects generation before Interview/Strategy selection exist", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Bakery" }, cookie));
    const { data } = await createRes.json();

    const res = await generateConceptBoardHandler(
      postRequest("/api/concept-board/generate", { projectId: data.projectId }, cookie),
    );
    expect(res.status).toBe(409);
  });

  it("supports text edit -> new version, reordering, and restore (텍스트 수정 / 순서 변경 / 버전 복원)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStrategy(cookie);
    await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, cookie));

    const patchRes = await patchConceptBoardHandler(
      postRequest(`/api/concept-board/${projectId}`, { brandSummary: "새로운 브랜드 요약" }, cookie),
      { params: Promise.resolve({ projectId }) },
    );
    const patchBody = await patchRes.json();
    expect(patchBody.data.board.currentVersion.versionNumber).toBe(2);
    expect(patchBody.data.board.currentVersion.source).toBe("user");

    const reorderRes = await patchConceptBoardHandler(
      postRequest(
        `/api/concept-board/${projectId}`,
        { sectionOrder: ["design_notes", "hero_image", "brand_summary", "core_values", "style_keywords", "color_palette", "typography_direction", "logo_concepts"] },
        cookie,
      ),
      { params: Promise.resolve({ projectId }) },
    );
    const reorderBody = await reorderRes.json();
    expect(reorderBody.data.board.currentVersion.data.sectionOrder[0]).toBe("design_notes");

    const restoreRes = await restoreConceptBoardHandler(
      postRequest(`/api/concept-board/${projectId}/restore`, { versionNumber: 1 }, cookie),
      { params: Promise.resolve({ projectId }) },
    );
    const restoreBody = await restoreRes.json();
    expect(restoreRes.status).toBe(200);
    expect(restoreBody.data.board.currentVersion.versionNumber).toBe(4);

    const getRes = await getConceptBoardHandler(
      new NextRequest(`http://localhost/api/concept-board/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const getBody = await getRes.json();
    expect(getBody.data.versions).toHaveLength(4);
  });

  it("advances the project to the mockup step (워크플로 진행)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithStrategy(cookie);
    // createProjectWithStrategy runs the pipeline through Aster Brain
    // selection (currentStep lands on "generation"); jump straight to
    // "concept_board" here rather than running a full async image
    // generation just to exercise this one currentStep transition.
    await prisma.project.update({ where: { id: projectId }, data: { currentStep: "concept_board" } });

    await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, cookie));

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("mockup");
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithStrategy(owner.cookie);
    await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, owner.cookie));

    const res = await getConceptBoardHandler(
      new NextRequest(`http://localhost/api/concept-board/${projectId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
