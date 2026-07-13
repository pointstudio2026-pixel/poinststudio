import { describe, expect, it, vi } from "vitest";
import { ListStylesUseCase } from "@/modules/styles/application/ListStylesUseCase";
import { RecommendStylesUseCase } from "@/modules/styles/application/RecommendStylesUseCase";
import { SelectStyleUseCase } from "@/modules/styles/application/SelectStyleUseCase";
import { GetStyleSelectionHistoryUseCase } from "@/modules/styles/application/GetStyleSelectionHistoryUseCase";
import { ToggleStyleFavoriteUseCase } from "@/modules/styles/application/ToggleStyleFavoriteUseCase";
import { ListFavoriteStylesUseCase } from "@/modules/styles/application/ListFavoriteStylesUseCase";
import {
  FakeStyleFavoriteRepository,
  FakeStyleRepository,
  FakeStyleSelectionRepository,
} from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
    mission: "신선한 빵을 제공한다",
    vision: "동네에서 가장 신뢰받는 베이커리",
    values: ["품질", "따뜻함"],
    positioning: "친근한 동네 베이커리",
    audience: "지역 주민",
    tone: "친근하고 따뜻한",
    personality: "친근하고 따뜻한",
    visualDirection: "미니멀, 중성 컬러",
    confidenceNotes: "",
    reasoningSummary: "",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "친근하고 따뜻한",
    personality: "친근하고 따뜻한",
    brandArchetype: "동반자 (The Everyman)",
    visualDirection: "미니멀, 중성 컬러",
    recommendedStyles: [],
    recommendedColors: [],
    recommendedTypography: [],
    recommendedSymbols: [],
  },
  styleCandidates: [
    { name: "Minimal", reason: "브랜드 톤과 어울립니다." },
    { name: "Modern", reason: "보완 후보입니다." },
  ],
  confidenceScore: 0.7,
};

function makeStyle(overrides: Partial<Style>): Style {
  return {
    id: overrides.id ?? "style",
    name: overrides.name ?? "Style",
    slug: overrides.slug ?? "style",
    level: overrides.level ?? 3,
    parentId: overrides.parentId ?? "parent",
    category: overrides.category ?? "Minimal",
    keywords: overrides.keywords ?? [],
    description: overrides.description ?? "설명",
  };
}

async function setup() {
  const projects = new FakeProjectRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const favorites = new FakeStyleFavoriteRepository();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });

  return {
    projectId,
    projects,
    strategies,
    styles,
    selections,
    favorites,
    list: new ListStylesUseCase(styles),
    recommend: new RecommendStylesUseCase(projects, strategies, styles),
    select: new SelectStyleUseCase(projects, styles, selections),
    history: new GetStyleSelectionHistoryUseCase(projects, selections),
    toggleFavorite: new ToggleStyleFavoriteUseCase(styles, favorites),
    listFavorites: new ListFavoriteStylesUseCase(favorites),
  };
}

describe("ListStylesUseCase", () => {
  it("defaults to leaf (level 3) styles when no level filter is given (스타일 필터)", async () => {
    const { styles, list } = await setup();
    styles.styles = [
      makeStyle({ id: "l1", level: 1, category: "Minimal" }),
      makeStyle({ id: "l3", level: 3, category: "Minimal" }),
    ];

    const { styles: result } = await list.execute({ category: "Minimal" });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("l3");
  });
});

describe("RecommendStylesUseCase", () => {
  it("blocks recommendations until a Brand Strategy exists (Brand Strategy 누락)", async () => {
    const { projectId, recommend } = await setup();
    await expect(recommend.execute({ projectId, userId: "user-1" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("ranks styles whose category matches the primary candidate first (업종별 추천)", async () => {
    const { projectId, strategies, styles, recommend } = await setup();
    await strategies.createWithFirstVersion(projectId, STRATEGY_DATA, "", "medium");
    styles.styles = [
      makeStyle({ id: "minimal-1", category: "Minimal", keywords: ["미니멀"] }),
      makeStyle({ id: "luxury-1", category: "Luxury", keywords: ["고급"] }),
    ];

    const recommendations = await recommend.execute({ projectId, userId: "user-1" });

    expect(recommendations[0]?.style.id).toBe("minimal-1");
    expect(recommendations[0]?.reason).toBeTruthy();
  });

  it("returns an empty list gracefully when no styles are seeded (추천 결과 없음)", async () => {
    const { projectId, strategies, recommend } = await setup();
    await strategies.createWithFirstVersion(projectId, STRATEGY_DATA, "", "medium");

    const recommendations = await recommend.execute({ projectId, userId: "user-1" });
    expect(recommendations).toEqual([]);
  });
});

describe("SelectStyleUseCase", () => {
  it("persists a selection and advances the project to the generation step (정상 선택)", async () => {
    const { projectId, projects, styles, select } = await setup();
    styles.styles = [makeStyle({ id: "minimal-1", category: "Minimal" })];
    const project = projects.projects.find((p) => p.id === projectId)!;
    project.currentStep = "style";

    const selection = await select.execute({
      projectId,
      userId: "user-1",
      primaryStyleId: "minimal-1",
      secondaryStyleIds: [],
    });

    expect(selection.primaryStyleId).toBe("minimal-1");
    const updated = await projects.findByIdForUser(projectId, "user-1");
    expect(updated?.currentStep).toBe("generation");
  });

  it("rejects a conflicting Primary/Secondary combination (STYLE-002)", async () => {
    const { projectId, styles, select } = await setup();
    styles.styles = [
      makeStyle({ id: "minimal-1", category: "Minimal" }),
      makeStyle({ id: "playful-1", category: "Playful" }),
    ];

    await expect(
      select.execute({
        projectId,
        userId: "user-1",
        primaryStyleId: "minimal-1",
        secondaryStyleIds: ["playful-1"],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects more than 2 secondary styles", async () => {
    const { projectId, styles, select } = await setup();
    styles.styles = [
      makeStyle({ id: "s1", category: "Modern" }),
      makeStyle({ id: "s2", category: "Tech" }),
      makeStyle({ id: "s3", category: "Editorial" }),
      makeStyle({ id: "s4", category: "Classic" }),
    ];

    await expect(
      select.execute({
        projectId,
        userId: "user-1",
        primaryStyleId: "s1",
        secondaryStyleIds: ["s2", "s3", "s4"],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("keeps a full selection history on reselection (동일 프로젝트 재선택)", async () => {
    const { projectId, styles, select, history } = await setup();
    styles.styles = [
      makeStyle({ id: "minimal-1", category: "Minimal" }),
      makeStyle({ id: "modern-1", category: "Modern" }),
    ];

    await select.execute({ projectId, userId: "user-1", primaryStyleId: "minimal-1", secondaryStyleIds: [] });
    await select.execute({ projectId, userId: "user-1", primaryStyleId: "modern-1", secondaryStyleIds: [] });

    const { current, history: list } = await history.execute({ projectId, userId: "user-1" });
    expect(list).toHaveLength(2);
    expect(current?.primaryStyleId).toBe("modern-1");
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const { projectId, history } = await setup();
    await expect(history.execute({ projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("Favorites", () => {
  it("supports favoriting and unfavoriting a style (즐겨찾기)", async () => {
    const { styles, toggleFavorite, listFavorites } = await setup();
    styles.styles = [makeStyle({ id: "minimal-1", category: "Minimal" })];

    await toggleFavorite.execute({ userId: "user-1", styleId: "minimal-1", favorite: true });
    expect(await listFavorites.execute({ userId: "user-1" })).toHaveLength(1);

    await toggleFavorite.execute({ userId: "user-1", styleId: "minimal-1", favorite: false });
    expect(await listFavorites.execute({ userId: "user-1" })).toHaveLength(0);
  });

  it("rejects favoriting a style that doesn't exist", async () => {
    const { toggleFavorite } = await setup();
    await expect(
      toggleFavorite.execute({ userId: "user-1", styleId: "missing", favorite: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
