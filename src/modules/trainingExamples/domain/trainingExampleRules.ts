import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";
import { REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";

/**
 * TrainingExample은 Vision AI로 분석하지 않는다(비용 발생 금지, 관리자
 * 지시사항) -- 관리자가 입력한 prompt 원문 자체가 이미 텍스트 학습
 * 데이터이므로, mockupRules.ts/styleRules.ts/logoStyleRules.ts와 동일한
 * "AI 호출 없는 결정론적 키워드 매칭" 패턴만으로 실제 프로젝트의 업종/
 * 목적 텍스트와 얼마나 겹치는지 점수화한다. deliverableType이 다르면
 * (명함 프로젝트에 포스터 예시가 뜨는 식으로) 아예 매칭 대상에서 제외한다.
 */
export interface TrainingExampleScoreInput {
  /** 인터뷰 답변(industry/purpose 등) + brandStrategy.mission을 합친 자유 텍스트. */
  keywordText: string;
  deliverableType: string;
  /** interviewQuestions.ts의 INDUSTRY_OPTIONS와 동일한 값(선택 사항). */
  industry?: string;
}

export interface TrainingExampleRecommendation {
  example: TrainingExample;
  score: number;
}

/** 자유 텍스트를 소문자 단어 토큰으로 쪼갠다(1글자 토큰 제외) -- prompt 원문에서 "키워드"를 뽑아내는 유일한 방법(별도 curated 키워드 목록이 없음). */
export function tokenizePromptText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.!?"'()·\-]+/)
    .filter((w) => w.length > 1);
}

export function scoreTrainingExample(example: TrainingExample, input: TrainingExampleScoreInput): number {
  if (example.deliverableType !== input.deliverableType) return 0;
  // 둘 다 업종이 있는데 다르면 아예 제외(명함 프로젝트에 포스터 예시가
  // 뜨면 안 되는 것과 동일한 원칙) -- 예시에 업종이 없으면(과거 데이터
  // 등) 이 필터를 적용하지 않고 기존처럼 키워드 겹침만으로 판단한다.
  if (example.industry && input.industry && example.industry !== input.industry) return 0;

  const words = tokenizePromptText(example.prompt);
  if (words.length === 0) return 0;

  const text = input.keywordText.toLowerCase();
  const matched = words.filter((w) => text.includes(w));
  const baseScore = matched.length / words.length;

  // 업종이 정확히 일치하면 가산점 -- DB에 저장된 업종 태그가 실제 사용
  // 시점에도 반영되도록.
  const industryBoost = example.industry && input.industry && example.industry === input.industry ? 0.2 : 0;

  return Math.round(Math.min(1, baseScore + industryBoost) * 100) / 100;
}

/** 점수 내림차순 -- 동점이면 원래 배열 순서(최신순으로 넘겨받는 것을 전제)를 유지한다(안정 정렬). */
export function rankTrainingExamples(
  examples: TrainingExample[],
  input: TrainingExampleScoreInput,
): TrainingExampleRecommendation[] {
  return examples
    .map((example) => ({ example, score: scoreTrainingExample(example, input) }))
    .sort((a, b) => b.score - a.score);
}
