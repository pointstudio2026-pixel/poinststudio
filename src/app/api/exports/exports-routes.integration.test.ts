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
import { POST as createExportHandler } from "@/app/api/exports/route";
import { GET as getExportsHandler } from "@/app/api/exports/[projectId]/route";
import { GET as getExportStatusHandler } from "@/app/api/exports/status/[exportId]/route";
import { GET as downloadExportHandler } from "@/app/api/exports/download/[exportId]/route";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";

const TEST_EMAIL_PREFIX = "task019-route";

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

async function pollExportStatus(exportId: string, cookie: string, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await getExportStatusHandler(
      new NextRequest(`http://localhost/api/exports/status/${exportId}`, { headers: { cookie } }),
      { params: Promise.resolve({ exportId }) },
    );
    const body = await res.json();
    if (body.data.export.status === "completed" || body.data.export.status === "failed") {
      return body.data.export;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for export ${exportId}`);
}

async function createProjectWithConceptBoard(cookie: string) {
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

  await generateConceptBoardHandler(postRequest("/api/concept-board/generate", { projectId }, cookie));

  return projectId;
}

describe("Export Center API routes", () => {
  it("renders a Concept Board PDF end-to-end and downloads it (PDF Export / 다운로드 가능)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithConceptBoard(cookie);

    const createRes = await createExportHandler(
      postRequest("/api/exports", { projectId, source: "concept_board", format: "pdf" }, cookie),
    );
    const createBody = await createRes.json();
    expect(createRes.status).toBe(202);

    const finalJob = await pollExportStatus(createBody.data.export.id, cookie);
    expect(finalJob.status).toBe("completed");
    expect(finalJob.fileSizeBytes).toBeGreaterThan(0);

    const downloadRes = await downloadExportHandler(
      new NextRequest(`http://localhost/api/exports/download/${finalJob.id}`, { headers: { cookie } }),
      { params: Promise.resolve({ exportId: finalJob.id }) },
    );
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get("Content-Type")).toBe("application/pdf");
    const bytes = Buffer.from(await downloadRes.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  }, 20000);

  it("rejects an invalid format for the source", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithConceptBoard(cookie);

    const res = await createExportHandler(
      postRequest("/api/exports", { projectId, source: "concept_board", format: "png" }, cookie),
    );
    expect(res.status).toBe(400);
  });

  it("lists export history for a project (Export 이력 저장)", async () => {
    const { cookie } = await createSessionCookie();
    const projectId = await createProjectWithConceptBoard(cookie);

    const createRes = await createExportHandler(
      postRequest("/api/exports", { projectId, source: "concept_board", format: "pdf" }, cookie),
    );
    const exportId = (await createRes.json()).data.export.id as string;
    await pollExportStatus(exportId, cookie);

    const listRes = await getExportsHandler(
      new NextRequest(`http://localhost/api/exports/${projectId}`, { headers: { cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    const listBody = await listRes.json();
    expect(listBody.data.exports).toHaveLength(1);
  }, 20000);

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const owner = await createSessionCookie();
    const other = await createSessionCookie();
    const projectId = await createProjectWithConceptBoard(owner.cookie);

    const res = await getExportsHandler(
      new NextRequest(`http://localhost/api/exports/${projectId}`, { headers: { cookie: other.cookie } }),
      { params: Promise.resolve({ projectId }) },
    );
    expect(res.status).toBe(404);
  });
});
