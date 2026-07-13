import { describe, expect, it, vi } from "vitest";
import { BuildConceptBoardUseCase } from "@/modules/conceptBoards/application/BuildConceptBoardUseCase";
import { GetConceptBoardUseCase } from "@/modules/conceptBoards/application/GetConceptBoardUseCase";
import { UpdateConceptBoardUseCase } from "@/modules/conceptBoards/application/UpdateConceptBoardUseCase";
import { RestoreConceptBoardVersionUseCase } from "@/modules/conceptBoards/application/RestoreConceptBoardVersionUseCase";
import { FakeConceptBoardRepository } from "@/modules/conceptBoards/testing/fakes";
import { FakeBrandBriefRepository } from "@/modules/brandBriefs/testing/fakes";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const BRIEF_DATA: BrandBriefData = {
  brandName: "Aster Bakery",
  industry: "bakery",
  tagline: "Aster Bakery — cozy",
  description: "fresh bread",
  mission: "fresh bread every morning",
  vision: "trusted bakery",
  coreValues: ["quality"],
  positioning: "친근한 동네 베이커리",
  primaryAudience: "local families",
  secondaryAudience: "",
  customerProblems: "",
  desiredImpression: "cozy",
  brandTone: "따뜻한",
  brandPersonality: "친근한",
  keywords: ["bakery"],
  avoidKeywords: [],
  preferredStyle: "미니멀",
  preferredColor: "중성",
  preferredSymbol: "심플",
  typographyDirection: "산세리프",
};

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
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
  styleCandidates: [{ name: "Minimal", reason: "" }],
  confidenceScore: 0.7,
};

async function setup() {
  const projects = new FakeProjectRepository();
  const briefs = new FakeBrandBriefRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const generations = new FakeGenerationRepository();
  const boards = new FakeConceptBoardRepository();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });

  return {
    projectId,
    projects,
    briefs,
    strategies,
    styles,
    selections,
    generations,
    boards,
    build: new BuildConceptBoardUseCase(projects, briefs, strategies, styles, selections, generations, boards),
    get: new GetConceptBoardUseCase(projects, boards),
    update: new UpdateConceptBoardUseCase(projects, boards),
    restore: new RestoreConceptBoardVersionUseCase(projects, boards),
  };
}

describe("BuildConceptBoardUseCase", () => {
  it("blocks generation until Brand Brief and Brand Strategy both exist", async () => {
    const ctx = await setup();
    await expect(ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("generates a v1 board even without any generated images yet (이미지 없음)", async () => {
    const ctx = await setup();
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
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
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
    const generation = await ctx.generations.createWithFirstVersion(ctx.projectId, { promptVersionId: "prompt-1" });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "url-1", thumbnailUrl: "t-1" }],
      completedAt: new Date(),
    });

    const board = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(board.currentVersion.data.heroImageUrl).toBe("url-1");
  });
});

describe("UpdateConceptBoardUseCase / GetConceptBoardUseCase", () => {
  it("creates a new version on text edit, preserving history (텍스트 수정)", async () => {
    const ctx = await setup();
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    const updated = await ctx.update.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      patch: { brandSummary: "직접 수정한 요약" },
    });

    expect(updated.currentVersion.versionNumber).toBe(2);
    expect(updated.currentVersion.source).toBe("user");
    expect(updated.currentVersion.data.brandSummary).toBe("직접 수정한 요약");
    expect(updated.currentVersion.data.coreValues).toEqual(BRIEF_DATA.coreValues);

    const { versions } = await ctx.get.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });

  it("persists a reordered sectionOrder (순서 변경)", async () => {
    const ctx = await setup();
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
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
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(ctx.get.execute({ projectId: ctx.projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("RestoreConceptBoardVersionUseCase", () => {
  it("restores an older version as a new version (버전 복원)", async () => {
    const ctx = await setup();
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
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
    await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.restore.execute({ projectId: ctx.projectId, userId: "user-1", versionNumber: 99 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
