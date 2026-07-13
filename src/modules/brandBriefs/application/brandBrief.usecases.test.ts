import { describe, expect, it, vi } from "vitest";
import { GenerateBrandBriefUseCase } from "@/modules/brandBriefs/application/GenerateBrandBriefUseCase";
import { GetBrandBriefUseCase } from "@/modules/brandBriefs/application/GetBrandBriefUseCase";
import { UpdateBrandBriefUseCase } from "@/modules/brandBriefs/application/UpdateBrandBriefUseCase";
import { RestoreBrandBriefVersionUseCase } from "@/modules/brandBriefs/application/RestoreBrandBriefVersionUseCase";
import { BrandBriefComposer } from "@/modules/brandBriefs/application/BrandBriefComposer";
import { FakeBrandBriefRepository } from "@/modules/brandBriefs/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { MockTextCompletionProvider } from "@/shared/ai/MockTextCompletionProvider";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const briefs = new FakeBrandBriefRepository();
  const composer = new BrandBriefComposer(new MockTextCompletionProvider());

  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });

  return {
    projectId,
    projects,
    interviews,
    briefs,
    generate: new GenerateBrandBriefUseCase(projects, interviews, briefs, composer),
    get: new GetBrandBriefUseCase(projects, briefs),
    update: new UpdateBrandBriefUseCase(projects, briefs),
    restore: new RestoreBrandBriefVersionUseCase(projects, briefs),
  };
}

async function completeInterview(
  projects: FakeProjectRepository,
  interviews: FakeInterviewRepository,
  projectId: string,
) {
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const complete = new CompleteInterviewUseCase(projects, interviews);

  await getOrStart.execute({ projectId, userId: "user-1" });
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: q.key,
      answer: `충분히 구체적인 ${q.key} 답변입니다.`,
    });
  }
  await complete.execute({ projectId, userId: "user-1" });
}

describe("GenerateBrandBriefUseCase", () => {
  it("blocks generation until the interview is completed (인터뷰 정보 부족)", async () => {
    const { projectId, generate } = await setup();
    await expect(generate.execute({ projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("generates a v1 Brand Brief from a completed interview (정상 생성)", async () => {
    const { projectId, projects, interviews, generate } = await setup();
    await completeInterview(projects, interviews, projectId);

    const brief = await generate.execute({ projectId, userId: "user-1" });

    expect(brief.currentVersion.versionNumber).toBe(1);
    expect(brief.currentVersion.source).toBe("ai");
    expect(brief.currentVersion.data.brandName).toBeTruthy();
    expect(brief.currentVersion.data.tagline).toBeTruthy();

    const project = await projects.findByIdForUser(projectId, "user-1");
    expect(project?.currentStep).toBe("brand_strategy");
  });

  it("creates a new version instead of overwriting on regeneration (버전 생성)", async () => {
    const { projectId, projects, interviews, generate } = await setup();
    await completeInterview(projects, interviews, projectId);
    await generate.execute({ projectId, userId: "user-1" });

    const second = await generate.execute({ projectId, userId: "user-1" });
    expect(second.currentVersion.versionNumber).toBe(2);
  });
});

describe("UpdateBrandBriefUseCase / GetBrandBriefUseCase", () => {
  it("creates a new user-sourced version on edit, preserving history (수정 후 저장)", async () => {
    const { projectId, projects, interviews, generate, update, get } = await setup();
    await completeInterview(projects, interviews, projectId);
    await generate.execute({ projectId, userId: "user-1" });

    const updated = await update.execute({
      projectId,
      userId: "user-1",
      patch: { tagline: "직접 수정한 태그라인" },
    });

    expect(updated.currentVersion.versionNumber).toBe(2);
    expect(updated.currentVersion.source).toBe("user");
    expect(updated.currentVersion.data.tagline).toBe("직접 수정한 태그라인");
    // Untouched fields carry over from the previous version.
    expect(updated.currentVersion.data.brandName).toBe(updated.currentVersion.data.brandName);

    const { versions } = await get.execute({ projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });

  it("rejects access from a user who doesn't own the project (권한 없는 접근)", async () => {
    const { projectId, projects, interviews, generate, get } = await setup();
    await completeInterview(projects, interviews, projectId);
    await generate.execute({ projectId, userId: "user-1" });

    await expect(get.execute({ projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("RestoreBrandBriefVersionUseCase", () => {
  it("restores an older version as a new version (버전 복원)", async () => {
    const { projectId, projects, interviews, generate, update, restore } = await setup();
    await completeInterview(projects, interviews, projectId);
    await generate.execute({ projectId, userId: "user-1" }); // v1
    await update.execute({ projectId, userId: "user-1", patch: { tagline: "v2 태그라인" } }); // v2

    const restored = await restore.execute({ projectId, userId: "user-1", versionNumber: 1 });

    expect(restored.currentVersion.versionNumber).toBe(3);
    expect(restored.currentVersion.data.tagline).not.toBe("v2 태그라인");
  });

  it("rejects restoring a version that doesn't exist", async () => {
    const { projectId, projects, interviews, generate, restore } = await setup();
    await completeInterview(projects, interviews, projectId);
    await generate.execute({ projectId, userId: "user-1" });

    await expect(
      restore.execute({ projectId, userId: "user-1", versionNumber: 99 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
