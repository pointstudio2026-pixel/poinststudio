import { describe, expect, it, vi } from "vitest";
import { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import { GetPromptUseCase } from "@/modules/prompts/application/GetPromptUseCase";
import { GetPromptVersionsUseCase } from "@/modules/prompts/application/GetPromptVersionsUseCase";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";
import { FakeLogoStyleCategoryRepository, FakeLogoStyleSelectionRepository } from "@/modules/logoStyles/testing/fakes";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";
import { FakeUserStyleCategoryRepository, FakeProjectUserStyleSelectionRepository } from "@/modules/userStyles/testing/fakes";
import { FakeColorPaletteSelectionRepository } from "@/modules/colorPalettes/testing/fakes";
import { FakeTrainingExampleRepository } from "@/modules/trainingExamples/testing/fakes";
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
    tone: "친근한",
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
    toneAndManner: "친근한",
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

const LOGO_STYLE_CATEGORY: LogoStyleCategory = {
  id: "logo-style-1",
  slug: "symbol-focused",
  name: "심볼 중심",
  description: "심플한 심볼을 중심으로 브랜드를 표현합니다.",
  subStyles: ["미니멀심볼"],
  keywords: ["심볼"],
  sampleImageUrl: "/logo-styles/symbol.svg",
  sortOrder: 1,
};

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const logoStyleCategories = new FakeLogoStyleCategoryRepository();
  const logoStyleSelections = new FakeLogoStyleSelectionRepository();
  const userStyleCategories = new FakeUserStyleCategoryRepository();
  const userStyleSelections = new FakeProjectUserStyleSelectionRepository();
  const colorPaletteSelections = new FakeColorPaletteSelectionRepository();
  const prompts = new FakePromptRepository();
  const trainingExamples = new FakeTrainingExampleRepository();

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
    logoStyleCategories,
    logoStyleSelections,
    userStyleCategories,
    userStyleSelections,
    colorPaletteSelections,
    prompts,
    trainingExamples,
    build: new BuildPromptUseCase(
      projects,
      interviews,
      strategies,
      styles,
      selections,
      logoStyleCategories,
      logoStyleSelections,
      userStyleCategories,
      userStyleSelections,
      colorPaletteSelections,
      prompts,
      trainingExamples,
    ),
    get: new GetPromptUseCase(projects, prompts),
    getVersions: new GetPromptVersionsUseCase(projects, prompts),
  };
}

async function fullySetUp(
  {
    projectId,
    projects,
    interviews,
    strategies,
    styles,
    selections,
    logoStyleCategories,
    logoStyleSelections,
  }: Awaited<ReturnType<typeof setup>>,
) {
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const complete = new CompleteInterviewUseCase(projects, interviews);

  await getOrStart.execute({ projectId, userId: "user-1" });
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    const answer = q.key === "brandName" ? "Aster Bakery" : `충분히 구체적인 ${q.key} 답변입니다.`;
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: q.key, answer });
  }
  await complete.execute({ projectId, userId: "user-1" });

  const strategy = await strategies.createWithFirstVersion(
    projectId,
    [STRATEGY_DATA, STRATEGY_DATA, STRATEGY_DATA],
    "",
    "medium",
  );
  await strategies.selectCandidate(strategy.id, 0);

  styles.styles = [PRIMARY_STYLE];
  await selections.create(projectId, PRIMARY_STYLE.id, []);

  logoStyleCategories.categories = [LOGO_STYLE_CATEGORY];
  await logoStyleSelections.create(projectId, [LOGO_STYLE_CATEGORY.id], LOGO_STYLE_CATEGORY.id);
}

describe("BuildPromptUseCase", () => {
  it("blocks building until Interview, selected Strategy, and a Style selection all exist (PROMPT-001)", async () => {
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

  it("includes a matching admin-registered TrainingExample as reference text, AI 호출 없이 순수 키워드 매칭만으로 (작업물 스타일 학습 자료)", async () => {
    const ctx = await setup();
    await fullySetUp(ctx);

    await ctx.trainingExamples.create({
      prompt: "fresh bread bakery logo, minimal sans-serif",
      deliverableType: "브랜딩 & 로고",
      imageStorageKey: "training-examples/x.png",
      imageContentType: "image/png",
      createdByUserId: "admin-1",
    });
    // 다른 유형이면 아무리 키워드가 겹쳐도 매칭에서 제외되어야 한다.
    await ctx.trainingExamples.create({
      prompt: "fresh bread bakery poster",
      deliverableType: "포스터",
      imageStorageKey: "training-examples/y.png",
      imageContentType: "image/png",
      createdByUserId: "admin-1",
    });

    const prompt = await ctx.build.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(prompt.currentVersion.userPrompt).toContain("fresh bread bakery logo");
    expect(prompt.currentVersion.userPrompt).not.toContain("fresh bread bakery poster");
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
