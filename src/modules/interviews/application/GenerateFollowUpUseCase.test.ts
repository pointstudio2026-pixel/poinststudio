import { describe, expect, it, vi } from "vitest";
import { GenerateFollowUpUseCase } from "@/modules/interviews/application/GenerateFollowUpUseCase";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { MAX_FOLLOW_UP_QUESTIONS } from "@/modules/interviews/domain/QuestionSelector";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import type {
  TextCompletionProvider,
  TextCompletionRequest,
} from "@/shared/ai/TextCompletionProvider";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

class FakeTextCompletionProvider implements TextCompletionProvider {
  readonly name = "fake";
  calls: TextCompletionRequest[] = [];

  async complete(request: TextCompletionRequest) {
    this.calls.push(request);
    return { text: `AI가 만든 후속 질문 #${this.calls.length}`, provider: this.name, model: "fake-1" };
  }

  async health() {
    return true;
  }
}

async function setupWithWeakAnswers() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const provider = new FakeTextCompletionProvider();
  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const generateFollowUp = new GenerateFollowUpUseCase(projects, interviews, provider);

  await getOrStart.execute({ projectId, userId: "user-1" });
  // Every required question gets a deliberately short (weak) answer.
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: q.key, answer: "짧음" });
  }

  return { projectId, provider, generateFollowUp, interviews };
}

describe("GenerateFollowUpUseCase", () => {
  it("generates an AI follow-up for the weakest answer (답변 부족)", async () => {
    const { projectId, provider, generateFollowUp } = await setupWithWeakAnswers();

    const result = await generateFollowUp.execute({ projectId, userId: "user-1" });

    expect(result.followUpGenerated).toBe(true);
    expect(provider.calls).toHaveLength(1);
    // brandName is the first required question in list order, so it's the
    // first weak answer found.
    expect(result.questions.at(-1)?.key).toBe("followUp_brandName");
  });

  it("does not generate a follow-up when all answers are sufficient (답변 충분)", async () => {
    const projects = new FakeProjectRepository();
    const interviews = new FakeInterviewRepository();
    const provider = new FakeTextCompletionProvider();
    const { projectId } = await new CreateProjectUseCase(projects).execute({
      userId: "user-1",
      name: "Brand",
    });
    const saveAnswer = new SaveAnswerUseCase(projects, interviews);
    const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
    const generateFollowUp = new GenerateFollowUpUseCase(projects, interviews, provider);
    await getOrStart.execute({ projectId, userId: "user-1" });

    for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
      await saveAnswer.execute({
        projectId,
        userId: "user-1",
        questionKey: q.key,
        answer: "이 항목에 대한 충분히 길고 구체적인 답변입니다. 세부 사항을 포함하고 있습니다.",
      });
    }

    const result = await generateFollowUp.execute({ projectId, userId: "user-1" });
    expect(result.followUpGenerated).toBe(false);
    expect(provider.calls).toHaveLength(0);
  });

  it("never asks about the same weak field twice, and stops at 3 follow-ups (최대 질문 수 초과 방지)", async () => {
    const { projectId, provider, generateFollowUp } = await setupWithWeakAnswers();

    const sourceKeys = new Set<string>();
    for (let i = 0; i < MAX_FOLLOW_UP_QUESTIONS; i++) {
      const result = await generateFollowUp.execute({ projectId, userId: "user-1" });
      expect(result.followUpGenerated).toBe(true);
      const key = result.questions.at(-1)!.key.replace("followUp_", "");
      expect(sourceKeys.has(key)).toBe(false); // 같은 질문 반복 금지
      sourceKeys.add(key);
    }

    // A 4th attempt must not exceed the cap.
    const fourth = await generateFollowUp.execute({ projectId, userId: "user-1" });
    expect(fourth.followUpGenerated).toBe(false);
    expect(provider.calls).toHaveLength(MAX_FOLLOW_UP_QUESTIONS);
  });
});
