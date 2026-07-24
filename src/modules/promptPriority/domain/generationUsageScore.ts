/**
 * 리서치 브랜드 자료/실사용자 생성물 승격 기준선. 처음엔 80점으로
 * 시작했지만(2026-07-23), 그 기준으로는 DB가 너무 천천히 쌓여서
 * 2026-07-24 사용자 지시로 60점으로 낮춤 -- "일단 60점 이상이면 다
 * 넣어놓자, 80점 기준으론 발전하는데 시간이 꽤 걸리겠다".
 */
export const REFERENCE_PROMOTION_THRESHOLD = 0.6;

export interface GenerationUsageSignals {
  /** 사용자가 직접 남긴 평가(있으면 이게 최우선 신호). */
  feedback?: { likedTags: string[]; dislikedTags: string[] } | null;
  /** 이 생성 이후 RetryGenerationUseCase가 호출된 적 있는지. */
  wasRetried: boolean;
  /** ExportJob에서 실제로 내보냈는지. */
  wasExported: boolean;
  /** 프로젝트가 mockup 단계 이후까지 진행됐는지(만족했다는 방증). */
  projectReachedMockupStage: boolean;
}

/**
 * 실제 생성 결과물이 DB 참고자료로 승격할 만한지 판단하는 점수. Vision AI
 * 호출 없음, AI 비용 0 -- 사용자가 직접 남긴 평가(있으면)를 최우선으로,
 * 없으면 행동 신호(재시도/내보내기/프로젝트 완료 여부)로 대체한다.
 */
export function computeGenerationUsageScore(signals: GenerationUsageSignals): number {
  const { feedback } = signals;
  if (feedback && (feedback.likedTags.length > 0 || feedback.dislikedTags.length > 0)) {
    const liked = feedback.likedTags.length;
    const disliked = feedback.dislikedTags.length;
    const total = liked + disliked;
    return Math.round((liked / total) * 100) / 100;
  }

  let score = 0.5;
  if (signals.wasRetried) score -= 0.3;
  if (signals.wasExported) score += 0.3;
  if (signals.projectReachedMockupStage) score += 0.2;
  return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}
