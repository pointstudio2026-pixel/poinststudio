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
import { POST as uploadLogoHandler } from "@/app/api/projects/[id]/logo/route";
import { GET as getLogoImageHandler } from "@/app/api/projects/[id]/logo/image/route";
import { POST as selectLogoChoiceHandler } from "@/app/api/projects/[id]/logo-choice/route";
import { POST as createGenerationHandler } from "@/app/api/generations/route";
import { GET as getGenerationStatusHandler } from "@/app/api/generations/status/[generationId]/route";

const TEST_EMAIL_PREFIX = "task024-logo-choice";

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
    emailVerifiedAt: new Date(),
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
  return new NextRequest(`http://localhost${path}`, { method: "POST", headers: { cookie }, body: formData });
}

async function advanceToLogoChoice(cookie: string) {
  const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Poster Project" }, cookie));
  const { data } = await createRes.json();
  const projectId = data.projectId as string;

  await selectDeliverableTypeHandler(
    postRequest(`/api/projects/${projectId}/deliverable-type`, { deliverableType: "포스터" }, cookie),
    { params: Promise.resolve({ id: projectId }) },
  );

  const interviewRes = await getInterviewHandler(
    new NextRequest(`http://localhost/api/interview/${projectId}`, { headers: { cookie } }),
    { params: Promise.resolve({ projectId }) },
  );
  const interviewBody = await interviewRes.json();
  for (const q of interviewBody.data.questions.filter((q: { required: boolean }) => q.required)) {
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

  return projectId;
}

async function pollStatus(generationVersionId: string, cookie: string, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await getGenerationStatusHandler(
      new NextRequest(`http://localhost/api/generations/status/${generationVersionId}`, { headers: { cookie } }),
      { params: Promise.resolve({ generationId: generationVersionId }) },
    );
    const body = await res.json();
    if (body.data.generation.status === "completed" || body.data.generation.status === "failed") {
      return body.data.generation;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for a terminal status on ${generationVersionId}`);
}

describe("실제 로고 첨부 목업 흐름 (포스터)", () => {
  it("업로드한 실제 로고를 그대로 목업에 합성해 생성 결과로 채운다", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await advanceToLogoChoice(cookie);

    const project1 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project1?.currentStep).toBe("logo_choice");

    const file = new File([Buffer.from(TINY_PNG_BASE64, "base64")], "logo.png", { type: "image/png" });
    const uploadRes = await uploadLogoHandler(uploadRequest(`/api/projects/${projectId}/logo`, file, cookie), {
      params: Promise.resolve({ id: projectId }),
    });
    expect(uploadRes.status).toBe(201);

    const imageRes = await getLogoImageHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}/logo/image`, { headers: { cookie } }),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(imageRes.status).toBe(200);

    const choiceRes = await selectLogoChoiceHandler(
      postRequest(`/api/projects/${projectId}/logo-choice`, { choice: "upload" }, cookie),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(choiceRes.status).toBe(201);

    const project2 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project2?.currentStep).toBe("generation");

    const createGenRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    expect(createGenRes.status).toBe(202);
    const createGenBody = await createGenRes.json();

    const finalVersion = await pollStatus(createGenBody.data.generation.id, cookie);
    expect(finalVersion.status).toBe("completed");
    expect(finalVersion.images.length).toBeGreaterThan(0);

    const project3 = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project3?.currentStep).toBe("concept_board");
  }, 30000);

  it("'상호명만으로 자동 생성'을 선택하면 첨부 없이도 기존처럼 생성된다", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await advanceToLogoChoice(cookie);

    const choiceRes = await selectLogoChoiceHandler(
      postRequest(`/api/projects/${projectId}/logo-choice`, { choice: "skip" }, cookie),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(choiceRes.status).toBe(201);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("generation");

    const createGenRes = await createGenerationHandler(postRequest("/api/generations", { projectId }, cookie));
    const createGenBody = await createGenRes.json();
    const finalVersion = await pollStatus(createGenBody.data.generation.id, cookie);
    expect(finalVersion.status).toBe("completed");
  }, 30000);

  it("첨부하지 않고 'upload'를 선택하면 거부된다", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await advanceToLogoChoice(cookie);

    const choiceRes = await selectLogoChoiceHandler(
      postRequest(`/api/projects/${projectId}/logo-choice`, { choice: "upload" }, cookie),
      { params: Promise.resolve({ id: projectId }) },
    );
    expect(choiceRes.status).toBe(400);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.currentStep).toBe("logo_choice");
  });
});
