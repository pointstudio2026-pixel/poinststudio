import { describe, expect, it, vi } from "vitest";
import { BuildConceptBoardUseCase } from "@/modules/conceptBoards/application/BuildConceptBoardUseCase";
import { GetConceptBoardUseCase } from "@/modules/conceptBoards/application/GetConceptBoardUseCase";
import { UpdateConceptBoardUseCase } from "@/modules/conceptBoards/application/UpdateConceptBoardUseCase";
import { RestoreConceptBoardVersionUseCase } from "@/modules/conceptBoards/application/RestoreConceptBoardVersionUseCase";
import { FakeConceptBoardRepository } from "@/modules/conceptBoards/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { FakeColorPaletteSelectionRepository } from "@/modules/colorPalettes/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
    industry: "bakery",
    mission: "fresh bread",
    vision: "trusted bakery",
    values: ["quality"],
    positioning: "친근한 동네 베이커리",
    audience: "local families",
    tone: "따뜻한",
    personality: "친근한",
    visualDirection: "미니멀",
    confidenceNotes: "",
    reasoningSummary: "",
    tagline: "Aster Bakery — cozy",
    keywords: ["bakery"],
    preferredColor: "중성",
    typographyDirection: "산세리프",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "따뜻한",
    personality: "친근한",
    brandArchetype: "동반자 (The Everyman)",
    visualDirection: "미니멀",
    recommendedStyles: [],
    recommendedColors: [],
    recommendedTypography: [],
    recommendedSymbols: [],
  },
  confidenceScore: 0.7,
};

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const generations = new FakeGenerationRepository();
  const colorPaletteSelections = new FakeColorPaletteSelectionRepository();
  const boards = new FakeConceptBoardRepository();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  await new SelectDeliverableTypeUseCase(projects).execute({
    projectId,
    userId: "user-1",
    deliverableType: "브랜딩 & 로고",
  });

  return {
    projectId,
    projects,
    interviews,
    strategies,
    styles,
    selections,
    generations,
    colorPaletteSelections,
    boards,
    build: new BuildConceptBoardUseCase(
      projects,
      interviews,
      strategies,
      styles,
      selections,
      generations,
      colorPaletteSelections,
      boards,
    ),
    get: new GetConceptBoardUseCase(projects, boards),
    update: new UpdateConceptBoardUseCase(projects, boards),
    restore: new RestoreConceptBoardVersionUseCase(projects, boards),
  };
}

async function completeInterview(projects: FakeProjectRepository, interviews: FakeInterviewRepository, projectId: string) {
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const complete = new CompleteInterviewUseCase(projects, interviews);

  await getOrStart.execute({ projectId, userId: "user-1" });
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    if (q.key === "brandName") {
      await saveAnswer.execute({ projectId, userId: "user-1", questionKey: q.key, answer: "Aster Bakery" });
    } else {
      await saveAnswer.execute({
        projectId,
        userId: "user-1",
        questionKey: q.key,
        answer: `충분히 구체적인 ${q.key} 답변입니다.`,
      });
    }
  }
  await complete.execute({ projectId, userId: "user-1" });
}

async function selectStrategy(strategies: FakeBrandStrategyRepository, projectId: string) {
  const strategy = await strategies.createWithFirstVersion(
    projectId,
    [STRATEGY_DATA, STRATEGY_DATA, STRATEGY_DATA],
    "",
    "medium",
  );
  await strategies.selectCandidate(strategy.id, 0);
}

describe("BuildConceptBoardUseCase", () => {
  it("blocks generation until Interview and a selected Brand Strategy both exist", async () => {
    const ctx = await setup();
    await expect(ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("generates a v1 board even without any generated images yet (이미지 없음)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    const project = ctx.projects.projects.find((p) => p.id === ctx.projectId)!;
    project.currentStep = "concept_board";

    const board = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(board.currentVersion.versionNumber).toBe(1);
    expect(board.currentVersion.data.heroImageUrl).toBeNull();
    expect(board.currentVersion.data.brandSummary).toContain("Aster Bakery");

    const updatedProject = await ctx.projects.findByIdForUser(ctx.projectId, "user-1");
    expect(updatedProject?.currentStep).toBe("mockup");
  });

  it("includes generated images once a completed generation exists (자동 생성)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    const generation = await ctx.generations.createWithFirstVersion(ctx.projectId, { promptVersionId: "prompt-1" });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "url-1", thumbnailUrl: "t-1" }],
      completedAt: new Date(),
    });

    const board = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(board.currentVersion.data.heroImageUrl).toBe("url-1");
  });

  it("aggregates images across all completed versions in the chain (버전당 1장 -- 누적 갤러리)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    const generation = await ctx.generations.createWithFirstVersion(ctx.projectId, { promptVersionId: "prompt-1" });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "url-1", thumbnailUrl: "t-1" }],
      completedAt: new Date(),
    });
    const second = await ctx.generations.addVersion(generation.id, { promptVersionId: "prompt-1" });
    await ctx.generations.updateVersionResult(second.currentVersion.id, {
      status: "completed",
      images: [{ url: "url-2", thumbnailUrl: "t-2" }],
      completedAt: new Date(),
    });
    const third = await ctx.generations.addVersion(generation.id, { promptVersionId: "prompt-1" });
    await ctx.generations.updateVersionResult(third.currentVersion.id, {
      status: "failed",
      errorMessage: "boom",
    });

    const board = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(board.currentVersion.data.heroImageUrl).toBe("url-1");
    expect(board.currentVersion.data.logoConceptImageUrls).toEqual(["url-1", "url-2"]);
  });
});

describe("UpdateConceptBoardUseCase / GetConceptBoardUseCase", () => {
  it("creates a new version on text edit, preserving history (텍스트 수정)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    const updated = await ctx.update.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      patch: { brandSummary: "직접 수정한 요약" },
    });

    expect(updated.currentVersion.versionNumber).toBe(2);
    expect(updated.currentVersion.source).toBe("user");
    expect(updated.currentVersion.data.brandSummary).toBe("직접 수정한 요약");
    expect(updated.currentVersion.data.coreValues).toEqual(STRATEGY_DATA.brandKnowledge.values);

    const { versions } = await ctx.get.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });

  it("persists a reordered sectionOrder (순서 변경)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    const reordered = ["design_notes", "hero_image"] as const;
    const updated = await ctx.update.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      patch: { sectionOrder: [...reordered] },
    });

    expect(updated.currentVersion.data.sectionOrder[0]).toBe("design_notes");
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(ctx.get.execute({ projectId: ctx.projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("RestoreConceptBoardVersionUseCase", () => {
  it("restores an older version as a new version (버전 복원)", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" }); // v1
    await ctx.update.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      patch: { brandSummary: "v2 요약" },
    }); // v2

    const restored = await ctx.restore.execute({ projectId: ctx.projectId, userId: "user-1", versionNumber: 1 });

    expect(restored.currentVersion.versionNumber).toBe(3);
    expect(restored.currentVersion.data.brandSummary).not.toBe("v2 요약");
  });

  it("rejects restoring a version that doesn't exist", async () => {
    const ctx = await setup();
    await completeInterview(ctx.projects, ctx.interviews, ctx.projectId);
    await selectStrategy(ctx.strategies, ctx.projectId);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.restore.execute({ projectId: ctx.projectId, userId: "user-1", versionNumber: 99 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
