export interface TrainingExampleEvaluationBreakdownEntry {
  score: number | null;
  reason?: string;
  flaggedTerms?: string[];
  note?: string;
}

/**
 * 어떤 생성 파이프라인의 참고 자료인지 -- 이미지생성(BuildPromptUseCase)과
 * 목업(ProcessMockupJobUseCase)은 완전히 다른 프롬프트 파이프라인이라
 * 데이터를 절대 섞지 않는다. 관리자가 나중에 새 카테고리를 더 추가할 수
 * 있어 닫힌 union이 아니라 string이다 -- 이 둘은 이미 있는/알려진 값.
 */
export const TRAINING_EXAMPLE_CATEGORY_IMAGE_GENERATION = "이미지생성";
export const TRAINING_EXAMPLE_CATEGORY_MOCKUP = "목업";
export const KNOWN_TRAINING_EXAMPLE_CATEGORIES = [
  TRAINING_EXAMPLE_CATEGORY_IMAGE_GENERATION,
  TRAINING_EXAMPLE_CATEGORY_MOCKUP,
] as const;

export interface TrainingExample {
  id: string;
  prompt: string;
  deliverableType: string;
  /** 실사용자 생성물 승격분(source="USER_GENERATION")은 이미지를 저장하지 않는다 -- null. */
  imageStorageKey: string | null;
  imageContentType: string | null;
  createdByUserId: string;
  createdAt: Date;
  evaluationScore: number | null;
  evaluationBreakdown: Record<string, TrainingExampleEvaluationBreakdownEntry> | null;
  evaluatedAt: Date | null;
  /** "ADMIN"(관리자 직접 입력) | "USER_GENERATION"(실사용자 생성물 승격) | "RESEARCHED_BRAND"(리서치한 실제 브랜드 사례, 나중에). */
  source: string;
  sourceGenerationVersionId: string | null;
  /** "이미지생성" | "목업" | (관리자가 나중에 추가한 다른 값). */
  category: string;
  /** interviewQuestions.ts의 INDUSTRY_OPTIONS와 동일한 값(선택 사항). */
  industry: string | null;
}
