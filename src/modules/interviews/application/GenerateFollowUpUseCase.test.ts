import { describe, expect, it, vi } from "vitest";
import { GenerateFollowUpUseCase } from "@/modules/interviews/application/GenerateFollowUpUseCase";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { MAX_FOLLOW_UP_QUESTIONS } from "@/modules/interviews/domain/QuestionSelector";
import { OTHER_ANSWER_PREFIX } from "@/modules/interviews/domain/interviewQuestions";
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

// desiredImpression은 allowOther가 없는 닫힌 5지선다라 findWeakAnswer가
// 절대 검사하지 않는다 -- 항상 유효한 옵션 값으로 채운다.
const VALID_DESIRED_IMPRESSION = "전문적이고 신뢰감 있는 느낌";

async function buildContext() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const provider = new FakeTextCompletionProvider();
  const { projectId } = await new CreateProjectUseCase(projects).execute({
    userId: "user-1",
    name: "Brand",
  });
  await new SelectDeliverableTypeUseCase(projects).execute({
    projectId,
    userId: "user-1",
    deliverableType: "브랜딩 & 로고",
  });
  const saveAnswer = new SaveAnswerUseCase(projects, interviews);
  const getOrStart = new GetOrStartInterviewUseCase(projects, interviews);
  const generateFollowUp = new GenerateFollowUpUseCase(projects, interviews, provider);
  await getOrStart.execute({ projectId, userId: "user-1" });
  return { projectId, projects, interviews, provider, saveAnswer, generateFollowUp };
}

describe("GenerateFollowUpUseCase", () => {
  it("generates an AI follow-up for a weak '기타(직접 입력)' free-text answer (답변 부족)", async () => {
    const { projectId, saveAnswer, provider, generateFollowUp } = await buildContext();
    // "교육" industry deliberately doesn't match any branching set, so the
    // question list stays exactly the 5 base questions. purpose is the
    // first question (in list order) with a weak "기타" answer -- industry
    // is a plain closed option (never weak), targetAudience and
    // desiredImpression are answered normally (not weak).
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "Aster" });
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "industry", answer: "교육" });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "purpose",
      answer: `${OTHER_ANSWER_PREFIX}짧음`,
    });
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "targetAudience", answer: "20대" });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "desiredImpression",
      answer: VALID_DESIRED_IMPRESSION,
    });

    const result = await generateFollowUp.execute({ projectId, userId: "user-1" });

    expect(result.followUpGenerated).toBe(true);
    expect(provider.calls).toHaveLength(1);
    expect(result.questions.at(-1)?.key).toBe("followUp_purpose");
  });

  it("does not generate a follow-up when all answers are sufficient (답변 충분)", async () => {
    const { projectId, saveAnswer, provider, generateFollowUp } = await buildContext();

    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "Aster" });
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "industry", answer: "교육" });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "purpose",
      answer: `${OTHER_ANSWER_PREFIX}이 항목에 대한 충분히 길고 구체적인 답변입니다.`,
    });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "targetAudience",
      answer: `${OTHER_ANSWER_PREFIX}세부 사항을 포함한 충분히 구체적인 답변입니다.`,
    });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "desiredImpression",
      answer: VALID_DESIRED_IMPRESSION,
    });

    const result = await generateFollowUp.execute({ projectId, userId: "user-1" });
    expect(result.followUpGenerated).toBe(false);
    expect(provider.calls).toHaveLength(0);
  });

  it("never asks about the same weak field twice, and stops at 3 follow-ups (최대 질문 수 초과 방지)", async () => {
    // "카페/커피" industry unlocks cafeAtmosphere(allowOther) on top of
    // purpose/targetAudience(both allowOther), giving exactly
    // MAX_FOLLOW_UP_QUESTIONS weak-capable fields to exercise the cap.
    const { projectId, saveAnswer, provider, generateFollowUp } = await buildContext();

    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "brandName", answer: "Aster" });
    await saveAnswer.execute({ projectId, userId: "user-1", questionKey: "industry", answer: "카페/커피" });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "purpose",
      answer: `${OTHER_ANSWER_PREFIX}짧음`,
    });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "targetAudience",
      answer: `${OTHER_ANSWER_PREFIX}짧음`,
    });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "desiredImpression",
      answer: VALID_DESIRED_IMPRESSION,
    });
    await saveAnswer.execute({
      projectId,
      userId: "user-1",
      questionKey: "cafeAtmosphere",
      answer: `${OTHER_ANSWER_PREFIX}짧음`,
    });

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
