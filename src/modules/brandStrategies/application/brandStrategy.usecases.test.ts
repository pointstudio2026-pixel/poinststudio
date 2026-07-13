import { describe, expect, it, vi } from "vitest";
import { ExecuteAsterBrainUseCase } from "@/modules/brandStrategies/application/ExecuteAsterBrainUseCase";
import { GetBrandStrategyUseCase } from "@/modules/brandStrategies/application/GetBrandStrategyUseCase";
import { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import { GenerateBrandBriefUseCase } from "@/modules/brandBriefs/application/GenerateBrandBriefUseCase";
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
  const strategies = new FakeBrandStrategyRepository();
  const briefComposer = new BrandBriefComposer(new MockTextCompletionProvider());
  const brainComposer = new AsterBrainComposer(new MockTextCompletionProvider());

  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });

  return {
    projectId,
    projects,
    interviews,
    briefs,
    strategies,
    generateBrief: new GenerateBrandBriefUseCase(projects, interviews, briefs, briefComposer),
    execute: new ExecuteAsterBrainUseCase(projects, interviews, briefs, strategies, brainComposer),
    get: new GetBrandStrategyUseCase(projects, strategies),
  };
}

async function completeInterviewAndBrief(
  projects: FakeProjectRepository,
  interviews: FakeInterviewRepository,
  generateBrief: GenerateBrandBriefUseCase,
  projectId: string,
  extraAnswers: Record<string, string> = {},
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
  for (const [key, answer] of Object.entries(extraAnswers)) {
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: key, answer });
  }
  await complete.execute({ projectId, userId: "user-1" });
  await generateBrief.execute({ projectId, userId: "user-1" });
}

describe("ExecuteAsterBrainUseCase", () => {
  it("blocks analysis until a Brand Brief exists (BRAIN-001 Missing Input)", async () => {
    const { projectId, execute } = await setup();
    await expect(
      execute.execute({ projectId, userId: "user-1", mode: "execute" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("produces Brand Knowledge, Strategy draft, style candidates, and confidence (정상 분석)", async () => {
    const { projectId, projects, interviews, generateBrief, execute } = await setup();
    await completeInterviewAndBrief(projects, interviews, generateBrief, projectId, {
      competitiveContext: "대형 프랜차이즈와 경쟁하는 상황입니다.",
      avoidKeywords: "차갑고 딱딱한 느낌",
    });

    const strategy = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    expect(strategy.currentVersion.versionNumber).toBe(1);
    expect(strategy.currentVersion.data.brandKnowledge.mission).toBeTruthy();
    expect(strategy.currentVersion.data.brandStrategy.brandArchetype).toBeTruthy();
    expect(strategy.currentVersion.data.styleCandidates.length).toBeGreaterThan(0);
    expect(strategy.currentVersion.confidenceLevel).toMatch(/high|medium|low/);

    const project = await projects.findByIdForUser(projectId, "user-1");
    expect(project?.currentStep).toBe("style");
  });

  it("is idempotent on repeated execute calls (no duplicate versions)", async () => {
    const { projectId, projects, interviews, generateBrief, execute } = await setup();
    await completeInterviewAndBrief(projects, interviews, generateBrief, projectId);

    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    const second = await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    expect(second.currentVersion.versionNumber).toBe(1);
  });

  it("creates a new version on rebuild (재분석)", async () => {
    const { projectId, projects, interviews, generateBrief, execute } = await setup();
    await completeInterviewAndBrief(projects, interviews, generateBrief, projectId);

    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    const rebuilt = await execute.execute({ projectId, userId: "user-1", mode: "rebuild" });

    expect(rebuilt.currentVersion.versionNumber).toBe(2);
  });
});

describe("GetBrandStrategyUseCase", () => {
  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const { projectId, projects, interviews, generateBrief, execute, get } = await setup();
    await completeInterviewAndBrief(projects, interviews, generateBrief, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });

    await expect(get.execute({ projectId, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("lists all versions after a rebuild (버전 비교)", async () => {
    const { projectId, projects, interviews, generateBrief, execute, get } = await setup();
    await completeInterviewAndBrief(projects, interviews, generateBrief, projectId);
    await execute.execute({ projectId, userId: "user-1", mode: "execute" });
    await execute.execute({ projectId, userId: "user-1", mode: "rebuild" });

    const { versions } = await get.execute({ projectId, userId: "user-1" });
    expect(versions).toHaveLength(2);
  });
});
