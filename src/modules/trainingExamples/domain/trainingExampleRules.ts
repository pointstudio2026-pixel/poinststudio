import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";

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
}

export interface TrainingExampleRecommendation {
  example: TrainingExample;
  score: number;
}

export function scoreTrainingExample(example: TrainingExample, input: TrainingExampleScoreInput): number {
  if (example.deliverableType !== input.deliverableType) return 0;

  const words = example.prompt
    .toLowerCase()
    .split(/[\s,.!?"'()·\-]+/)
    .filter((w) => w.length > 1);
  if (words.length === 0) return 0;

  const text = input.keywordText.toLowerCase();
  const matched = words.filter((w) => text.includes(w));
  return Math.round((matched.length / words.length) * 100) / 100;
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
