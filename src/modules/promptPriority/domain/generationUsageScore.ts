/**
 * 리서치 브랜드 자료/실사용자 생성물 승격 기준선. 처음엔 80점으로
 * 시작했지만(2026-07-23), 그 기준으로는 DB가 너무 천천히 쌓여서
 * 2026-07-24 사용자 지시로 60점으로 낮춤 -- "일단 60점 이상이면 다
 * 넣어놓자, 80점 기준으론 발전하는데 시간이 꽤 걸리겠다". 2026-07-25
 * 사용자 재지시로 다시 나눔: 60~79점은 "애매한" 신호라 아예 저장하지
 * 않고, 80점 이상만 참고(reference)로, 이 값(60점) 미만만 회피(avoid)로
 * 남긴다. 이 상수는 이제 회피(avoid) 컷오프 전용이다 -- 참고 컷오프는
 * REFERENCE_PROMOTION_UPPER_THRESHOLD.
 */
export const REFERENCE_PROMOTION_THRESHOLD = 0.6;

/** 참고(reference) 자료로 저장/사용하는 컷오프 -- 이 값 이상만 DB에 남는다(2026-07-25). */
export const REFERENCE_PROMOTION_UPPER_THRESHOLD = 0.8;

/**
 * 평가가 전혀 없을 때의 기본 점수. 60~79점 구간(NEUTRAL_SCORE 포함)은
 * DB에 저장되지 않으므로, 사실상 "평가 안 남긴 결과물은 DB에 안 쌓인다"는
 * 뜻이다(2026-07-25 사용자 지시).
 */
const NEUTRAL_SCORE = 0.7;

export interface GenerationUsageSignals {
  /** 사용자가 직접 남긴 평가 -- 이제 이게 유일한 신호다. */
  feedback?: { likedTags: string[]; dislikedTags: string[] } | null;
}

/**
 * 실제 생성 결과물이 DB 참고자료로 승격할 만한지 판단하는 점수. Vision AI
 * 호출 없음, AI 비용 0 -- 사용자가 직접 남긴 평가만 본다. 재시도/내보내기/
 * 프로젝트 진행도 같은 행동 신호는 더 이상 쓰지 않는다(2026-07-25 사용자
 * 지시: "사용자가 export하지 않았다고 점수 깎는건 아닌 것 같아" -- 내보내기
 * 안 했다고 나쁜 결과물이라는 보장이 없는데 감점하는 건 잘못된 대리 신호였다).
 * 평가가 없으면 보통(neutral) 점수를 줘서 애초에 DB에 안 쌓이게 하고,
 * 아쉬운 점을 남기면 회피(avoid)로, 좋았던 점을 남기면 참고(reference)로
 * 자연스럽게 갈린다.
 */
export function computeGenerationUsageScore(signals: GenerationUsageSignals): number {
  const { feedback } = signals;
  if (!feedback || (feedback.likedTags.length === 0 && feedback.dislikedTags.length === 0)) {
    return NEUTRAL_SCORE;
  }

  const liked = feedback.likedTags.length;
  const disliked = feedback.dislikedTags.length;
  const total = liked + disliked;
  return Math.round((liked / total) * 100) / 100;
}
