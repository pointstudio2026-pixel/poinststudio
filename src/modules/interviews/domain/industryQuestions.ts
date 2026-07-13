import type { InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";

interface IndustryQuestionSet {
  /** Keywords matched (case-insensitive, substring) against the user's free-text industry answer. */
  matchKeywords: string[];
  questions: InterviewQuestionDef[];
}

// 09_PRD_BrandInterview.md "Dynamic Questions" examples, extended with an
// IT startup set (Task-008 Test Checklist: 카페/병원/IT 스타트업).
const INDUSTRY_QUESTION_SETS: IndustryQuestionSet[] = [
  {
    matchKeywords: ["카페", "커피", "cafe", "coffee"],
    questions: [
      {
        key: "cafeAtmosphere",
        text: "어떤 분위기를 전달하고 싶습니까?",
        type: "textarea",
        required: true,
      },
      {
        key: "cafeSignatureMenu",
        text: "대표 메뉴는 무엇입니까?",
        type: "text",
        required: false,
      },
    ],
  },
  {
    matchKeywords: ["병원", "의원", "클리닉", "hospital", "clinic"],
    questions: [
      {
        key: "hospitalTrustFactor",
        text: "가장 중요한 신뢰 요소는 무엇입니까?",
        type: "textarea",
        required: true,
      },
      {
        key: "hospitalPatientFocus",
        text: "주로 어떤 환자층을 대상으로 하나요?",
        type: "text",
        required: false,
      },
    ],
  },
  {
    matchKeywords: ["스타트업", "it", "테크", "tech", "startup", "소프트웨어", "앱"],
    questions: [
      {
        key: "startupCoreFeature",
        text: "제품/서비스의 핵심 기능은 무엇인가요?",
        type: "textarea",
        required: true,
      },
      {
        key: "startupCustomerType",
        text: "B2B와 B2C 중 어느 쪽에 가깝나요?",
        type: "text",
        required: false,
      },
    ],
  },
];

/** Rule-based industry branching — no AI involved (Task-008 scope). */
export function matchIndustryQuestions(industryAnswer: string): InterviewQuestionDef[] {
  const normalized = industryAnswer.trim().toLowerCase();
  if (!normalized) return [];

  const match = INDUSTRY_QUESTION_SETS.find((set) =>
    set.matchKeywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );
  return match?.questions ?? [];
}
