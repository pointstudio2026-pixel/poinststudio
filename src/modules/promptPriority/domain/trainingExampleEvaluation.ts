import { applySafetyRules } from "@/modules/prompts/domain/promptSafety";
import { tokenizePromptText } from "@/modules/trainingExamples/domain/trainingExampleRules";
import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";

export interface TrainingExampleEvaluationBreakdown {
  safety: { score: number; flaggedTerms: string[] };
  originality: { score: number; note: string };
  brandFit: { score: null; reason: string };
  purposeFit: { score: null; reason: string };
  readability: { score: null; reason: string };
  dbPatternAlignment: { score: null; reason: string };
}

export interface TrainingExampleEvaluationResult {
  score: number;
  breakdown: TrainingExampleEvaluationBreakdown;
}

const NOT_APPLICABLE_REASON =
  "requires live project context or vision analysis -- not applicable to reference material";

/**
 * 관리자가 입력한(또는 실제 생성물에서 승격된) 참고 자료의 텍스트만으로
 * 계산 가능한 평가. Vision AI 호출 없음, AI 비용 0. 6축 전체 평가는 하지
 * 않는다 -- 프로젝트 컨텍스트가 없어 브랜드적합성/실용성/가독성은 애초에
 * 계산 불가능하고, DB패턴적합도는 자기 자신과 비교할 대상이 없어 해당
 * 없음. 텍스트만으로 되는 안전성 게이트 + 독창성만 계산하고, 그 둘만으로
 * 재정규화한 점수를 낸다(빈 값을 0으로 섞어 거짓 평균을 만들지 않는다).
 */
export function evaluateTrainingExamplePromptText(
  prompt: string,
  deliverableType: string,
  existingExamples: TrainingExample[],
): TrainingExampleEvaluationResult {
  const safetyResult = applySafetyRules(prompt);
  const safetyScore = safetyResult.flaggedTerms.length > 0 ? 0 : 1;

  const promptTokens = new Set(tokenizePromptText(prompt));
  const sameTypeExamples = existingExamples.filter((e) => e.deliverableType === deliverableType);

  let maxOverlap = 0;
  for (const other of sameTypeExamples) {
    const otherTokens = tokenizePromptText(other.prompt);
    if (promptTokens.size === 0 || otherTokens.length === 0) continue;
    const shared = otherTokens.filter((t) => promptTokens.has(t)).length;
    const overlap = shared / promptTokens.size;
    if (overlap > maxOverlap) maxOverlap = overlap;
  }
  const originalityScore = Math.round((1 - maxOverlap) * 100) / 100;

  const applicableScores = [safetyScore, originalityScore];
  const score = Math.round((applicableScores.reduce((a, b) => a + b, 0) / applicableScores.length) * 100) / 100;

  return {
    score,
    breakdown: {
      safety: { score: safetyScore, flaggedTerms: safetyResult.flaggedTerms },
      originality: {
        score: originalityScore,
        note:
          sameTypeExamples.length > 0
            ? `같은 유형 예시 ${sameTypeExamples.length}건 중 최대 ${Math.round(maxOverlap * 100)}% 키워드 중복`
            : "비교 대상 없음(같은 유형의 첫 예시)",
      },
      brandFit: { score: null, reason: NOT_APPLICABLE_REASON },
      purposeFit: { score: null, reason: NOT_APPLICABLE_REASON },
      readability: { score: null, reason: NOT_APPLICABLE_REASON },
      dbPatternAlignment: { score: null, reason: "자기 자신과 비교할 수 없음(N/A)" },
    },
  };
}
