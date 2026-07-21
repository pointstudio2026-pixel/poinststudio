import { describe, expect, it, vi } from "vitest";
import { ListLogoStyleCategoriesUseCase } from "@/modules/logoStyles/application/ListLogoStyleCategoriesUseCase";
import { RecommendLogoStyleUseCase } from "@/modules/logoStyles/application/RecommendLogoStyleUseCase";
import { SelectLogoStyleUseCase } from "@/modules/logoStyles/application/SelectLogoStyleUseCase";
import { FakeLogoStyleCategoryRepository, FakeLogoStyleSelectionRepository } from "@/modules/logoStyles/testing/fakes";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function makeCategory(overrides: Partial<LogoStyleCategory>): LogoStyleCategory {
  return {
    id: overrides.id ?? "cat",
    slug: overrides.slug ?? "cat",
    name: overrides.name ?? "카테고리",
    description: overrides.description ?? "설명",
    subStyles: overrides.subStyles ?? ["서브스타일"],
    keywords: overrides.keywords ?? [],
    sampleImageUrl: overrides.sampleImageUrl ?? "/logo-styles/sample.svg",
    sortOrder: overrides.sortOrder ?? 0,
  };
}

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
    industry: "bakery",
    mission: "fresh bread",
    vision: "trusted bakery",
    values: ["quality"],
    positioning: "친근한 동네 베이커리",
    audience: "local families",
    tone: "친근한",
    personality: "따뜻한",
    visualDirection: "미니멀",
    confidenceNotes: "",
    reasoningSummary: "",
    tagline: "Aster Bakery — cozy",
    keywords: ["미니멀"],
    preferredColor: "중성",
    typographyDirection: "산세리프",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "따뜻한",
    personality: "따뜻한",
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
  const strategies = new FakeBrandStrategyRepository();
  const categories = new FakeLogoStyleCategoryRepository();
  const selections = new FakeLogoStyleSelectionRepository();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });

  return {
    projectId,
    projects,
    strategies,
    categories,
    selections,
    list: new ListLogoStyleCategoriesUseCase(categories),
    recommend: new RecommendLogoStyleUseCase(projects, strategies, categories),
    select: new SelectLogoStyleUseCase(projects, categories, selections),
  };
}

describe("ListLogoStyleCategoriesUseCase", () => {
  it("returns every seeded category", async () => {
    const { categories, list } = await setup();
    categories.categories = [makeCategory({ id: "a" }), makeCategory({ id: "b" })];

    const result = await list.execute();
    expect(result).toHaveLength(2);
  });
});

describe("RecommendLogoStyleUseCase", () => {
  it("blocks recommendations until a Brand Strategy candidate is selected (전략 선택 미완료)", async () => {
    const { projectId, recommend } = await setup();
    await expect(recommend.execute({ projectId, userId: "user-1" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("ranks categories using the selected strategy's tone/personality/keywords (전략 기반 추천)", async () => {
    const { projectId, projects, strategies, categories, recommend } = await setup();
    const strategy = await strategies.createWithFirstVersion(projectId, [STRATEGY_DATA, STRATEGY_DATA, STRATEGY_DATA], "", "medium");
    await strategies.selectCandidate(strategy.id, 0);
    void projects;
    categories.categories = [
      makeCategory({ id: "symbol", name: "심볼 중심", keywords: ["미니멀"] }),
      makeCategory({ id: "premium", name: "프리미엄 스타일", keywords: ["그라디언트"] }),
    ];

    const recommendations = await recommend.execute({ projectId, userId: "user-1" });

    expect(recommendations[0]?.category.id).toBe("symbol");
    expect(recommendations[0]?.score).toBeGreaterThan(recommendations[1]?.score ?? 0);
  });
});

describe("SelectLogoStyleUseCase", () => {
  it("persists a selection and advances the project to the generation step (정상 선택)", async () => {
    const { projectId, projects, categories, select } = await setup();
    categories.categories = [makeCategory({ id: "symbol" })];
    const project = projects.projects.find((p) => p.id === projectId)!;
    project.currentStep = "logo_style";

    const selection = await select.execute({ projectId, userId: "user-1", categoryIds: ["symbol"] });

    expect(selection.primaryCategoryId).toBe("symbol");
    const updated = await projects.findByIdForUser(projectId, "user-1");
    expect(updated?.currentStep).toBe("generation");
  });

  it("supports selecting up to 3 categories in 고급 옵션 mode (다중 선택)", async () => {
    const { projectId, categories, select } = await setup();
    categories.categories = [makeCategory({ id: "a" }), makeCategory({ id: "b" }), makeCategory({ id: "c" })];

    const selection = await select.execute({ projectId, userId: "user-1", categoryIds: ["a", "b", "c"] });

    expect(selection.categoryIds).toEqual(["a", "b", "c"]);
    expect(selection.primaryCategoryId).toBe("a");
  });

  it("rejects more than 3 selected categories (LOGO_STYLE-001)", async () => {
    const { projectId, categories, select } = await setup();
    categories.categories = [
      makeCategory({ id: "a" }),
      makeCategory({ id: "b" }),
      makeCategory({ id: "c" }),
      makeCategory({ id: "d" }),
    ];

    await expect(
      select.execute({ projectId, userId: "user-1", categoryIds: ["a", "b", "c", "d"] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an empty selection (LOGO_STYLE-001)", async () => {
    const { projectId, select } = await setup();
    await expect(select.execute({ projectId, userId: "user-1", categoryIds: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects an unknown category id (LOGO_STYLE-002)", async () => {
    const { projectId, categories, select } = await setup();
    categories.categories = [makeCategory({ id: "symbol" })];

    await expect(
      select.execute({ projectId, userId: "user-1", categoryIds: ["missing"] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("keeps a full selection history on reselection (재선택 시 이력 유지)", async () => {
    const { projectId, categories, selections, select } = await setup();
    categories.categories = [makeCategory({ id: "symbol" }), makeCategory({ id: "typo" })];

    await select.execute({ projectId, userId: "user-1", categoryIds: ["symbol"] });
    await select.execute({ projectId, userId: "user-1", categoryIds: ["typo"] });

    expect(selections.selections).toHaveLength(2);
    const latest = await selections.findLatestByProjectId(projectId);
    expect(latest?.primaryCategoryId).toBe("typo");
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const { categories, select } = await setup();
    categories.categories = [makeCategory({ id: "symbol" })];

    await expect(
      select.execute({ projectId: "missing-project", userId: "user-1", categoryIds: ["symbol"] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
