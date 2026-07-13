export interface InterviewQuestionDef {
  key: string;
  text: string;
  type: "text" | "textarea";
  required: boolean;
}

// Task-007 scope: a fixed base question set (5~8개, 09_PRD_BrandInterview.md
// "Business Rules"). Industry-based branching/AI follow-up questions are
// Task-008's "동적 질문 생성 로직", explicitly out of scope here.
export const INTERVIEW_QUESTIONS: InterviewQuestionDef[] = [
  { key: "brandName", text: "브랜드 이름이 무엇인가요?", type: "text", required: true },
  { key: "industry", text: "어떤 업종인가요?", type: "text", required: true },
  {
    key: "purpose",
    text: "이 브랜드가 존재하는 목적은 무엇인가요?",
    type: "textarea",
    required: true,
  },
  {
    key: "coreValues",
    text: "브랜드가 가장 중요하게 생각하는 가치는 무엇인가요?",
    type: "textarea",
    required: true,
  },
  {
    key: "targetAudience",
    text: "주요 타깃 고객은 누구인가요?",
    type: "textarea",
    required: true,
  },
  {
    key: "competitiveContext",
    text: "경쟁 브랜드나 시장 환경에 대해 알려주세요.",
    type: "textarea",
    required: false,
  },
  {
    key: "desiredImpression",
    text: "고객이 브랜드에서 느꼈으면 하는 인상은 무엇인가요?",
    type: "textarea",
    required: true,
  },
  {
    key: "avoidKeywords",
    text: "피하고 싶은 이미지나 표현이 있나요?",
    type: "textarea",
    required: false,
  },
];
