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
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

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
  const interviews = new FakeInterviewRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const favorites = new FakeStyleFavoriteRepository();

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
    styles,
    selections,
    favorites,
    list: new ListStylesUseCase(styles),
    recommend: new RecommendStylesUseCase(projects, interviews, styles),
    select: new SelectStyleUseCase(projects, styles, selections),
    history: new GetStyleSelectionHistoryUseCase(projects, selections),
    toggleFavorite: new ToggleStyleFavoriteUseCase(styles, favorites),
    listFavorites: new ListFavoriteStylesUseCase(favorites),
  };
}

async function completeInterview(
  projects: FakeProjectRepository,
  interviews: FakeInterviewRepository,
  projectId: string,
  purpose = "미니멀하고 심플한 느낌의 브랜드를 만들고 싶습니다",
) {
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const complete = new CompleteInterviewUseCase(projects, interviews);

  await getOrStart.execute({ projectId, userId: "user-1" });
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    const answer = q.key === "purpose" ? purpose : `충분히 구체적인 ${q.key} 답변입니다.`;
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: q.key, answer });
  }
  await complete.execute({ projectId, userId: "user-1" });
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

  it("scopes results to a specific parent for 대분류→중분류→소분류 drill-down (parentId 필터)", async () => {
    const { styles, list } = await setup();
    styles.styles = [
      makeStyle({ id: "l2-a", level: 2, parentId: "l1-x", category: "Minimal" }),
      makeStyle({ id: "l2-b", level: 2, parentId: "l1-y", category: "Minimal" }),
    ];

    const { styles: result } = await list.execute({ level: 2, parentId: "l1-x" });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("l2-a");
  });
});

describe("RecommendStylesUseCase", () => {
  it("blocks recommendations until the Interview is completed (인터뷰 미완료)", async () => {
    const { projectId, recommend } = await setup();
    await expect(recommend.execute({ projectId, userId: "user-1" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("ranks styles whose category matches the interview-inferred candidate first (업종별 추천)", async () => {
    const { projectId, projects, interviews, styles, recommend } = await setup();
    await completeInterview(projects, interviews, projectId);
    styles.styles = [
      makeStyle({ id: "minimal-1", category: "미니멀", keywords: ["미니멀"] }),
      makeStyle({ id: "luxury-1", category: "럭셔리", keywords: ["고급"] }),
    ];

    const recommendations = await recommend.execute({ projectId, userId: "user-1" });

    expect(recommendations[0]?.style.id).toBe("minimal-1");
    expect(recommendations[0]?.reason).toBeTruthy();
  });

  it("returns an empty list gracefully when no styles are seeded (추천 결과 없음)", async () => {
    const { projectId, projects, interviews, recommend } = await setup();
    await completeInterview(projects, interviews, projectId);

    const recommendations = await recommend.execute({ projectId, userId: "user-1" });
    expect(recommendations).toEqual([]);
  });
});

describe("SelectStyleUseCase", () => {
  it("persists a selection and advances the project to the brand_strategy step (정상 선택)", async () => {
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
    expect(updated?.currentStep).toBe("brand_strategy");
  });

  it("rejects a conflicting Primary/Secondary combination (STYLE-002)", async () => {
    const { projectId, styles, select } = await setup();
    styles.styles = [
      // 실제 충돌 규칙(styleRules.ts)이 한글 대분류명으로 정의돼 있어
      // 이 테스트만은 그 값을 그대로 써야 한다 -- 파일의 다른 테스트는
      // 임의의 자체 일관적인 라벨이라 영문이어도 무방하다.
      makeStyle({ id: "minimal-1", category: "미니멀" }),
      makeStyle({ id: "playful-1", category: "플레이풀" }),
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
