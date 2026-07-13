import { describe, expect, it, vi } from "vitest";
import { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import { GetPromptUseCase } from "@/modules/prompts/application/GetPromptUseCase";
import { GetPromptVersionsUseCase } from "@/modules/prompts/application/GetPromptVersionsUseCase";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeBrandBriefRepository } from "@/modules/brandBriefs/testing/fakes";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";
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
  brandTone: "친근한",
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
    tone: "친근한",
    personality: "친근한",
    visualDirection: "미니멀",
    confidenceNotes: "",
    reasoningSummary: "",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "친근한",
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

const PRIMARY_STYLE: Style = {
  id: "style-1",
  name: "Monochrome Bold",
  slug: "minimal-monochrome-bold",
  level: 3,
  parentId: "parent-1",
  category: "Minimal",
  keywords: ["미니멀"],
  description: "설명",
};

async function setup() {
  const projects = new FakeProjectRepository();
  const briefs = new FakeBrandBriefRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const prompts = new FakePromptRepository();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });

  return {
    projectId,
    projects,
    briefs,
    strategies,
    styles,
    selections,
    prompts,
    build: new BuildPromptUseCase(projects, briefs, strategies, styles, selections, prompts),
    get: new GetPromptUseCase(projects, prompts),
    getVersions: new GetPromptVersionsUseCase(projects, prompts),
  };
}

async function fullySetUp(
  { projectId, briefs, strategies, styles, selections }: Awaited<ReturnType<typeof setup>>,
) {
  await briefs.createWithFirstVersion(projectId, BRIEF_DATA, "ai");
  await strategies.createWithFirstVersion(projectId, STRATEGY_DATA, "", "medium");
  styles.styles = [PRIMARY_STYLE];
  await selections.create(projectId, PRIMARY_STYLE.id, []);
}

describe("BuildPromptUseCase", () => {
  it("blocks building until Brief, Strategy, and a Style selection all exist (PROMPT-001)", async () => {
    const ctx = await setup();
    await expect(ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("builds a v1 prompt with a default provider (정상 생성)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);

    const prompt = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(prompt.currentVersion.versionNumber).toBe(1);
    expect(prompt.currentVersion.provider).toBe("openai");
    expect(prompt.currentVersion.systemPrompt).toBeTruthy();
    expect(prompt.currentVersion.userPrompt).toContain("Aster Bakery");
    expect(prompt.currentVersion.hash).toHaveLength(64);
  });

  it("produces the same hash for an unchanged rebuild (동일 입력 재현)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);

    const first = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });
    const second = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(second.currentVersion.versionNumber).toBe(2);
    expect(second.currentVersion.hash).toBe(first.currentVersion.hash);
  });

  it("produces a different hash when the provider changes (Provider 변경)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);

    const openai = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1", provider: "openai" });
    const gemini = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1", provider: "gemini" });

    expect(openai.currentVersion.hash).not.toBe(gemini.currentVersion.hash);
    expect(gemini.currentVersion.payload.model).not.toBe(openai.currentVersion.payload.model);
  });

  it("keeps a full version history for comparison (Version 비교)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);

    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1", provider: "gemini" });

    const versions = await ctx.getVersions.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);
    await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(ctx.get.execute({ projectId: ctx.projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
