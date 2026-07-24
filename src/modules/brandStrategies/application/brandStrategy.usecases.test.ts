import { describe, expect, it, vi } from "vitest";
import { ExecuteAsterBrainUseCase } from "@/modules/brandStrategies/application/ExecuteAsterBrainUseCase";
import { SelectBrandStrategyUseCase } from "@/modules/brandStrategies/application/SelectBrandStrategyUseCase";
import { GetBrandStrategyUseCase } from "@/modules/brandStrategies/application/GetBrandStrategyUseCase";
import { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import { SelectStyleUseCase } from "@/modules/styles/application/SelectStyleUseCase";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakeColorPaletteSelectionRepository } from "@/modules/colorPalettes/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const styles = new FakeStyleRepository();
  const styleSelections = new FakeStyleSelectionRepository();
  const strategies = new FakeBrandStrategyRepository();
  const colorPaletteSelections = new FakeColorPaletteSelectionRepository();
  const brainComposer = new AsterBrainComposer();

  styles.styles = [
    {
      id: "style-1",
      name: "Style",
      slug: "style-1",
      level: 3,
      parentId: "parent-1",
      category: "미니멀",
      keywords: [],
      description: "설명",
      sampleImageUrl: null,
    },
  ];

  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });
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
    styleSelections,
    strategies,
    colorPaletteSelections,
    selectStyle: new SelectStyleUseCase(projects, styles, styleSelections),
    execute: new ExecuteAsterBrainUseCase(
      projects,
      interviews,
      styleSelections,
      strategies,
      brainComposer,
      colorPaletteSelections,
      styles,
    ),
    select: new SelectBrandStrategyUseCase(projects, strategies),
    get: new GetBrandStrategyUseCase(projects, strategies),
  };
}

async function completeInterviewAndSelectStyle(
  projects: FakeProjectRepository,
  interviews: FakeInterviewRepository,
  selectStyle: SelectStyleUseCase,
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
  await selectStyle.execute({ projectId, userId: "user-1", primaryStyleId: "style-1", secondaryStyleIds: [] });
}

describe("ExecuteAsterBrainUseCase", () => {
  it("blocks analysis until Interview and Style selection exist (BRAIN-001 Missing Input)", async () => {
    const { projectId, execute } = await setup();
    await expect(
      execute.execute({ projectId, userId: "user-1", mode: "execute" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("produces 3 candidates with Brand Knowledge, Strategy draft, and confidence (정상 분석)", async () => {
    const { projectId, projects, interviews, selectStyle, execute } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);

    const strategy = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    expect(strategy.currentVersion.versionNumber).toBe(1);
    expect(strategy.currentVersion.candidates).toHaveLength(3);
    expect(strategy.currentVersion.selectedIndex).toBeNull();
    expect(strategy.currentVersion.data.brandKnowledge.mission).toBeTruthy();
    expect(strategy.currentVersion.data.brandStrategy.brandArchetype).toBeTruthy();
    expect(strategy.currentVersion.confidenceLevel).toMatch(/high|medium|low/);

    const project = await projects.findByIdForUser(projectId, "user-1");
    expect(project?.currentStep).toBe("brand_strategy");
  });

  it("is idempotent on repeated execute calls (no duplicate versions)", async () => {
    const { projectId, projects, interviews, selectStyle, execute } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);

    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    const second = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    expect(second.currentVersion.versionNumber).toBe(1);
  });

  it("creates a new version with a fresh candidate set on rebuild (재분석)", async () => {
    const { projectId, projects, interviews, selectStyle, execute } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);

    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    const rebuilt = await execute.execute({ projectId, userId: "user-1", mode: "rebuild" });

    expect(rebuilt.currentVersion.versionNumber).toBe(2);
    expect(rebuilt.currentVersion.selectedIndex).toBeNull();
    expect(rebuilt.currentVersion.candidates).toHaveLength(3);
  });

  it("shows the user's Style-step color selection as the recommended color when one exists (스타일 선택이 우선)", async () => {
    const { projectId, projects, interviews, selectStyle, execute, colorPaletteSelections } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);
    await colorPaletteSelections.create({
      projectId,
      presetSlug: "deep-ocean",
      swatches: [{ hex: "#0c4a6e", label: "Deep Ocean" }],
    });

    const strategy = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    for (const candidate of strategy.currentVersion.candidates) {
      expect(candidate.brandStrategy.recommendedColors[0]?.value).toContain("#0c4a6e");
    }
    expect(strategy.currentVersion.data.brandStrategy.recommendedColors[0]?.value).toContain("#0c4a6e");
  });

  it("keeps the rule-based recommended color when no Style-step selection exists (AI/규칙 기반이 우선)", async () => {
    const { projectId, projects, interviews, selectStyle, execute } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);

    const strategy = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    expect(strategy.currentVersion.data.brandStrategy.recommendedColors[0]?.value).not.toContain("#");
  });
});

describe("SelectBrandStrategyUseCase", () => {
  it("selects a candidate, updates data/selectedIndex, and advances the project (전략 선택)", async () => {
    const { projectId, projects, interviews, selectStyle, execute, select } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    const updated = await select.execute({ projectId, userId: "user-1", candidateIndex: 1 });

    expect(updated.currentVersion.selectedIndex).toBe(1);
    expect(updated.currentVersion.data).toEqual(updated.currentVersion.candidates[1]);

    const project = await projects.findByIdForUser(projectId, "user-1");
    expect(project?.currentStep).toBe("logo_style");
  });

  it("rejects an out-of-range candidate index", async () => {
    const { projectId, projects, interviews, selectStyle, execute, select } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    await expect(
      select.execute({ projectId, userId: "user-1", candidateIndex: 5 }),
    ).rejects.toThrow();
  });
});

describe("GetBrandStrategyUseCase", () => {
  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const { projectId, projects, interviews, selectStyle, execute, get } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    await expect(get.execute({ projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("lists all versions after a rebuild (버전 비교)", async () => {
    const { projectId, projects, interviews, selectStyle, execute, get } = await setup();
    await completeInterviewAndSelectStyle(projects, interviews, selectStyle, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    await execute.execute({ projectId, userId: "user-1", mode: "rebuild" });

    const { versions } = await get.execute({ projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });
});
