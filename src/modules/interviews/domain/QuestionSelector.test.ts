import { describe, expect, it } from "vitest";
import {
  findWeakAnswer,
  getMissingRequiredQuestions,
  selectQuestions,
} from "@/modules/interviews/domain/QuestionSelector";
import { matchIndustryQuestions } from "@/modules/interviews/domain/industryQuestions";
import { matchDeliverableTypeQuestions } from "@/modules/interviews/domain/deliverableTypeQuestions";
import { INTERVIEW_QUESTIONS, OTHER_ANSWER_PREFIX } from "@/modules/interviews/domain/interviewQuestions";
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
    const questions = selectQuestions(interview, null);
    expect(questions).toHaveLength(INTERVIEW_QUESTIONS.length);
  });

  it("inserts industry questions right after the industry question once answered", () => {
    const interview = buildInterview({
      answers: [
        { questionKey: "industry", questionText: "어떤 업종인가요?", answer: "카페", sequence: 1 },
      ],
    });
    const questions = selectQuestions(interview, null);
    const industryIdx = questions.findIndex((q) => q.key === "industry");
    expect(questions[industryIdx + 1]?.key).toBe("cafeAtmosphere");
    expect(questions).toHaveLength(INTERVIEW_QUESTIONS.length + 2);
  });

  it("inserts deliverable-type-specific questions right after brandName (작업물 유형별 질문)", () => {
    const interview = buildInterview();
    const questions = selectQuestions(interview, "포스터");
    expect(questions[1]?.key).toBe("posterContext");
    expect(questions).toHaveLength(
      INTERVIEW_QUESTIONS.length + matchDeliverableTypeQuestions("포스터").length,
    );
  });

  it("adds no extra question for 브랜딩 & 로고 or null (별도 단계로 깊이를 얻으므로)", () => {
    const interview = buildInterview();
    expect(selectQuestions(interview, "브랜딩 & 로고")).toHaveLength(INTERVIEW_QUESTIONS.length);
    expect(selectQuestions(interview, null)).toHaveLength(INTERVIEW_QUESTIONS.length);
  });

  it("combines a deliverable-type question with an industry question correctly (이중 스플라이스)", () => {
    const interview = buildInterview({
      answers: [
        { questionKey: "industry", questionText: "어떤 업종인가요?", answer: "카페", sequence: 1 },
      ],
    });
    const questions = selectQuestions(interview, "포스터");
    expect(questions.map((q) => q.key)).toEqual([
      "brandName",
      "posterContext",
      "posterRequiredElements",
      "deliverableOrientation",
      "deliverableImageStyle",
      "deliverableBackgroundStyle",
      "deliverableAvoidElements",
      "industry",
      "cafeAtmosphere",
      "cafeSignatureMenu",
      "purpose",
      "targetAudience",
      "desiredImpression",
      "additionalNotes",
    ]);
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
    const questions = selectQuestions(interview, null);
    expect(questions.at(-1)?.key).toBe("followUp_purpose");
    expect(questions.at(-1)?.required).toBe(true);
  });
});

describe("findWeakAnswer (신뢰도가 낮으면 보충 질문)", () => {
  // 이번 전환 후 base 질문 세트에는 필수 textarea가 하나도 남지 않는다 --
  // 대신 select+allowOther 질문에서 "기타(직접 입력)"를 고른 자유 텍스트가
  // 너무 짧을 때를 검사한다("purpose"는 multiple+allowOther).
  it("flags a short '기타(직접 입력)' free-text answer as weak", () => {
    const questions = selectQuestions(buildInterview(), null);
    const answers = [
      { questionKey: "purpose", questionText: "x", answer: `${OTHER_ANSWER_PREFIX}음`, sequence: 2 },
    ];
    const weak = findWeakAnswer(questions, answers);
    expect(weak?.key).toBe("purpose");
    expect(weak?.answer).toBe("음");
  });

  it("does not flag a plain closed-option answer, however short (닫힌 보기는 검사 대상 아님)", () => {
    const questions = selectQuestions(buildInterview(), null);
    const answers = [{ questionKey: "purpose", questionText: "x", answer: "창업/오픈", sequence: 2 }];
    expect(findWeakAnswer(questions, answers)).toBeNull();
  });

  it("does not re-flag a question that already received a follow-up (같은 질문 반복 금지)", () => {
    const questions = selectQuestions(buildInterview(), null);
    const answers = [
      { questionKey: "purpose", questionText: "x", answer: `${OTHER_ANSWER_PREFIX}음`, sequence: 2 },
      { questionKey: "followUp_purpose", questionText: "더 알려주세요", answer: "", sequence: 100 },
    ];
    expect(findWeakAnswer(questions, answers)).toBeNull();
  });

  it("does not flag a sufficiently detailed '기타' answer", () => {
    const questions = selectQuestions(buildInterview(), null);
    const answers = [
      {
        questionKey: "purpose",
        questionText: "x",
        answer: `${OTHER_ANSWER_PREFIX}지역 주민들에게 신선한 빵을 매일 제공하기 위해 시작했습니다.`,
        sequence: 2,
      },
    ];
    expect(findWeakAnswer(questions, answers)).toBeNull();
  });
});

describe("getMissingRequiredQuestions", () => {
  it("lists required questions with no answer yet", () => {
    const questions = selectQuestions(buildInterview(), null);
    const missing = getMissingRequiredQuestions(questions, []);
    expect(missing.length).toBeGreaterThan(0);
  });
});
