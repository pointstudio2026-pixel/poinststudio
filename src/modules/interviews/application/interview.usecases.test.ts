import { describe, expect, it, vi } from "vitest";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });
  return {
    projectId,
    projects,
    interviews,
    getOrStart: new GetOrStartInterviewUseCase(projects, interviews),
    saveAnswer: new SaveAnswerUseCase(projects, interviews),
    complete: new CompleteInterviewUseCase(projects, interviews),
  };
}

async function answerAllRequired(
  saveAnswer: SaveAnswerUseCase,
  projectId: string,
  overrides: Record<string, string> = {},
) {
  // Sequential, matching the real UI: one question is saved (and awaited)
  // before the user moves to the next.
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: q.key,
      answer: overrides[q.key] ?? `${q.key} answer`,
    });
  }
}

describe("GetOrStartInterviewUseCase", () => {
  it("starts a brand-new interview on first entry (첫 질문 진입)", async () => {
    const { projectId, getOrStart } = await setup();
    const result = await getOrStart.execute({ projectId, userId: "user-1" });

    expect(result.interview.status).toBe("in_progress");
    expect(result.interview.currentQuestionIndex).toBe(0);
    expect(result.questions).toHaveLength(INTERVIEW_QUESTIONS.length);
  });

  it("rejects a project the user doesn't own", async () => {
    const { projectId, getOrStart } = await setup();
    await expect(
      getOrStart.execute({ projectId, userId: "someone-else" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("resumes progress instead of restarting (새로고침 후 복원)", async () => {
    const { projectId, getOrStart, saveAnswer } = await setup();
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "Aster" });

    const result = await getOrStart.execute({ projectId, userId: "user-1" });
    expect(result.interview.currentQuestionIndex).toBe(1);
    expect(result.interview.answers.find((a) => a.questionKey === "brandName")?.answer).toBe(
      "Aster",
    );
  });

  it("shows the completed interview on re-entry instead of a fresh one (완료 후 재진입)", async () => {
    const { projectId, getOrStart, saveAnswer, complete } = await setup();
    await answerAllRequired(saveAnswer, projectId);
    await complete.execute({ projectId, userId: "user-1" });

    const result = await getOrStart.execute({ projectId, userId: "user-1" });
    expect(result.interview.status).toBe("completed");
  });
});

describe("SaveAnswerUseCase", () => {
  it("allows editing an earlier answer without regressing progress (이전/다음 이동)", async () => {
    const { projectId, saveAnswer } = await setup();
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "A" });
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "industry", answer: "Coffee" });

    const result = await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "brandName",
      answer: "Aster Coffee",
    });

    expect(result.interview.currentQuestionIndex).toBe(2); // stayed at the furthest point reached
    expect(result.interview.answers.find((a) => a.questionKey === "brandName")?.answer).toBe(
      "Aster Coffee",
    );
  });

  it("rejects an empty answer for a required question (필수값 누락)", async () => {
    const { projectId, saveAnswer } = await setup();
    await expect(
      saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "  " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("accepts an empty answer for an optional question", async () => {
    const { projectId, saveAnswer } = await setup();
    await expect(
      saveAnswer.execute({
        projectId,
        userId: "user-1",
        questionKey: "competitiveContext",
        answer: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("rejects saving to an already-completed interview", async () => {
    const { projectId, saveAnswer, complete } = await setup();
    await answerAllRequired(saveAnswer, projectId);
    await complete.execute({ projectId, userId: "user-1" });

    await expect(
      saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "x" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("CompleteInterviewUseCase", () => {
  it("rejects completion while required questions are unanswered", async () => {
    const { projectId, saveAnswer, complete } = await setup();
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "Aster" });

    await expect(complete.execute({ projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("completes and advances the project to brand_brief", async () => {
    const { projectId, projects, saveAnswer, complete } = await setup();
    await answerAllRequired(saveAnswer, projectId);

    const result = await complete.execute({ projectId, userId: "user-1" });
    expect(result.status).toBe("completed");

    const project = await projects.findByIdForUser(projectId, "user-1");
    expect(project?.currentStep).toBe("brand_brief");
  });
});
