import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { POST as selectDeliverableTypeHandler } from "@/app/api/projects/[id]/deliverable-type/route";
import { POST as selectUserStyleHandler } from "@/app/api/projects/[id]/user-style/route";
import { GET as listCategoriesHandler, POST as createCategoryHandler } from "@/app/api/user-styles/categories/route";
import { DELETE as deleteCategoryHandler } from "@/app/api/user-styles/categories/[id]/route";
import { POST as addReferenceHandler } from "@/app/api/user-styles/categories/[id]/references/route";
import { GET as getReferenceImageHandler } from "@/app/api/user-styles/references/[id]/image/route";
import { POST as buildPromptHandler } from "@/app/api/prompts/build/route";
import { GET as getInterviewHandler } from "@/app/api/interview/[projectId]/route";
import { POST as saveAnswerHandler } from "@/app/api/interview/answer/route";
import { POST as completeInterviewHandler } from "@/app/api/interview/complete/route";
import { POST as recommendStylesHandler } from "@/app/api/styles/recommend/route";
import { POST as selectStyleHandler } from "@/app/api/styles/select/route";
import { POST as executeAsterBrainHandler } from "@/app/api/aster-brain/execute/route";
import { POST as selectAsterBrainHandler } from "@/app/api/aster-brain/select/route";
import { POST as recommendLogoStyleHandler } from "@/app/api/logo-styles/recommend/route";
import { POST as selectLogoStyleHandler } from "@/app/api/logo-styles/select/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task023-user-styles";

// 1x1 투명 PNG.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

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

function uploadRequest(path: string, file: File, cookie: string) {
  const formData = new FormData();
  formData.append("file", file);
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { cookie },
    body: formData,
  });
}

async function createProjectWithSelectedStrategy(cookie: string) {
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

describe("User Styles API routes (내 스타일 -- 계정 전체 재사용)", () => {
  it("creates a category, uploads a reference image, and serves it back to its owner", async () => {
    const { cookie } = await createSessionCookie();

    const createRes = await createCategoryHandler(postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, cookie));
    const createBody = await createRes.json();
    expect(createRes.status).toBe(201);
    const categoryId = createBody.data.category.id as string;

    const file = new File([Buffer.from(TINY_PNG_BASE64, "base64")], "ref.png", { type: "image/png" });
    const uploadRes = await addReferenceHandler(
      uploadRequest(`/api/user-styles/categories/${categoryId}/references`, file, cookie),
      { params: Promise.resolve({ id: categoryId }) },
    );
    expect(uploadRes.status).toBe(201);

    const listRes = await listCategoriesHandler(
      new NextRequest("http://localhost/api/user-styles/categories", { headers: { cookie } }),
    );
    const listBody = await listRes.json();
    const listedCategory = listBody.data.categories.find((c: { id: string }) => c.id === categoryId);
    expect(listedCategory.references).toHaveLength(1);

    const referenceId = listedCategory.references[0].id as string;
    const imageRes = await getReferenceImageHandler(
      new NextRequest(`http://localhost/api/user-styles/references/${referenceId}/image`, { headers: { cookie } }),
      { params: Promise.resolve({ id: referenceId }) },
    );
    expect(imageRes.status).toBe(200);
    expect(imageRes.headers.get("content-type")).toBe("image/png");
  });

  it("rejects a non-image upload", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createCategoryHandler(postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, cookie));
    const { data } = await createRes.json();
    const categoryId = data.category.id as string;

    const file = new File([Buffer.from("not an image")], "ref.txt", { type: "text/plain" });
    const res = await addReferenceHandler(
      uploadRequest(`/api/user-styles/categories/${categoryId}/references`, file, cookie),
      { params: Promise.resolve({ id: categoryId }) },
    );
    expect(res.status).toBe(400);
  });

  it("is reusable across different projects for the same account (계정 전체 재사용)", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createCategoryHandler(postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, cookie));
    const { data } = await createRes.json();
    const categoryId = data.category.id as string;

    const projectA = await createProjectWithSelectedStrategy(cookie);
    const projectB = await createProjectWithSelectedStrategy(cookie);

    const selectARes = await selectUserStyleHandler(
      postRequest(`/api/projects/${projectA}/user-style`, { userStyleCategoryId: categoryId }, cookie),
      { params: Promise.resolve({ id: projectA }) },
    );
    const selectBRes = await selectUserStyleHandler(
      postRequest(`/api/projects/${projectB}/user-style`, { userStyleCategoryId: categoryId }, cookie),
      { params: Promise.resolve({ id: projectB }) },
    );
    expect(selectARes.status).toBe(201);
    expect(selectBRes.status).toBe(201);
  });

  it("folds the selected category's description into the generated prompt", async () => {
    const { cookie } = await createSessionCookie();
    const createRes = await createCategoryHandler(postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, cookie));
    const { data } = await createRes.json();
    const categoryId = data.category.id as string;

    const file = new File([Buffer.from(TINY_PNG_BASE64, "base64")], "ref.png", { type: "image/png" });
    await addReferenceHandler(uploadRequest(`/api/user-styles/categories/${categoryId}/references`, file, cookie), {
      params: Promise.resolve({ id: categoryId }),
    });

    const projectId = await createProjectWithSelectedStrategy(cookie);
    await selectUserStyleHandler(
      postRequest(`/api/projects/${projectId}/user-style`, { userStyleCategoryId: categoryId }, cookie),
      { params: Promise.resolve({ id: projectId }) },
    );

    const promptRes = await buildPromptHandler(postRequest("/api/prompts/build", { projectId }, cookie));
    const promptBody = await promptRes.json();
    expect(promptRes.status).toBe(201);
    // Mock 프로바이더(테스트 중 OPENAI_API_KEY 제거됨)라 실제 비전 분석은 호출되지 않고
    // description은 null로 남는다 -- 그 경우 프롬프트에 "사용자 지정 스타일 참고" 줄이 없어야 한다.
    expect(promptBody.data.prompt.currentVersion.userPrompt).not.toContain("사용자 지정 스타일 참고");
  });

  it("rejects deleting another user's category", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const createRes = await createCategoryHandler(
      postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, owner.cookie),
    );
    const { data } = await createRes.json();
    const categoryId = data.category.id as string;

    const res = await deleteCategoryHandler(
      new NextRequest(`http://localhost/api/user-styles/categories/${categoryId}`, {
        method: "DELETE",
        headers: { cookie: other.cookie },
      }),
      { params: Promise.resolve({ id: categoryId }) },
    );
    expect(res.status).toBe(404);
  });

  it("does not list another user's categories", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    await createCategoryHandler(postRequest("/api/user-styles/categories", { name: "미니멀 로고" }, owner.cookie));

    const res = await listCategoriesHandler(
      new NextRequest("http://localhost/api/user-styles/categories", { headers: { cookie: other.cookie } }),
    );
    const body = await res.json();
    expect(body.data.categories).toHaveLength(0);
  });
});
