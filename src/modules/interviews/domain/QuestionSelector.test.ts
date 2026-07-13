import { describe, expect, it } from "vitest";
import {
  findWeakAnswer,
  getMissingRequiredQuestions,
  selectQuestions,
} from "@/modules/interviews/domain/QuestionSelector";
import { matchIndustryQuestions } from "@/modules/interviews/domain/industryQuestions";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import type { Interview } from "@/modules/interviews/domain/Interview";

function buildInterview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: "interview-1",
    projectId: "project-1",
    status: "in_progress",
    currentQuestionIndex: 0,
    startedAt: new Date(),
    completedAt: null,
    answers: [],
    ...overrides,
  };
}

describe("matchIndustryQuestions (업종별 질문 세트)", () => {
  it("adds cafe-specific questions for 카페 업종", () => {
    const questions = matchIndustryQuestions("카페");
    expect(questions.map((q) => q.key)).toContain("cafeAtmosphere");
  });

  it("adds hospital-specific questions for 병원 업종", () => {
    const questions = matchIndustryQuestions("소아과 병원");
    expect(questions.map((q) => q.key)).toContain("hospitalTrustFactor");
  });

  it("adds startup-specific questions for IT 스타트업", () => {
    const questions = matchIndustryQuestions("IT 스타트업");
    expect(questions.map((q) => q.key)).toContain("startupCoreFeature");
  });

  it("returns no extra questions for an unmatched industry", () => {
    expect(matchIndustryQuestions("농업")).toEqual([]);
    expect(matchIndustryQuestions("")).toEqual([]);
  });
});

describe("selectQuestions", () => {
  it("returns only the base questions before industry is answered", () => {
    const interview = buildInterview();
    const questions = selectQuestions(interview);
    expect(questions).toHaveLength(INTERVIEW_QUESTIONS.length);
  });

  it("inserts industry questions right after the industry question once answered", () => {
    const interview = buildInterview({
      answers: [
        { questionKey: "industry", questionText: "어떤 업종인가요?", answer: "카페", sequence: 1 },
      ],
    });
    const questions = selectQuestions(interview);
    const industryIdx = questions.findIndex((q) => q.key === "industry");
    expect(questions[industryIdx + 1]?.key).toBe("cafeAtmosphere");
    expect(questions).toHaveLength(INTERVIEW_QUESTIONS.length + 2);
  });

  it("appends persisted follow-up questions at the end, in order", () => {
    const interview = buildInterview({
      answers: [
        {
          questionKey: "followUp_purpose",
          questionText: "목적을 더 구체적으로 알려주세요.",
          answer: "",
          sequence: 100,
        },
      ],
    });
    const questions = selectQuestions(interview);
    expect(questions.at(-1)?.key).toBe("followUp_purpose");
    expect(questions.at(-1)?.required).toBe(true);
  });
});

describe("findWeakAnswer (신뢰도가 낮으면 보충 질문)", () => {
  it("flags a very short required answer as weak", () => {
    const questions = selectQuestions(buildInterview());
    const answers = [{ questionKey: "purpose", questionText: "x", answer: "그냥", sequence: 2 }];
    const weak = findWeakAnswer(questions, answers);
    expect(weak?.key).toBe("purpose");
  });

  it("does not re-flag a question that already received a follow-up (같은 질문 반복 금지)", () => {
    const questions = selectQuestions(buildInterview());
    const answers = [
      { questionKey: "purpose", questionText: "x", answer: "그냥", sequence: 2 },
      { questionKey: "followUp_purpose", questionText: "더 알려주세요", answer: "", sequence: 100 },
    ];
    expect(findWeakAnswer(questions, answers)).toBeNull();
  });

  it("does not flag a sufficiently detailed answer", () => {
    const questions = selectQuestions(buildInterview());
    const answers = [
      {
        questionKey: "purpose",
        questionText: "x",
        answer: "이 브랜드는 신선한 재료로 만든 빵을 지역 주민들에게 제공하는 것을 목표로 합니다.",
        sequence: 2,
      },
    ];
    expect(findWeakAnswer(questions, answers)).toBeNull();
  });
});

describe("getMissingRequiredQuestions", () => {
  it("lists required questions with no answer yet", () => {
    const questions = selectQuestions(buildInterview());
    const missing = getMissingRequiredQuestions(questions, []);
    expect(missing.length).toBeGreaterThan(0);
  });
});
