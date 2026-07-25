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

/**
 * 사용자 평가(행동 패턴) 점수와 Vision AI 판단 점수, 두 개의 서로 다른
 * 기준으로 따로 매겨지던 점수가 행마다 들쑥날쑥해 보인다는 문제 제기
 * (2026-07-25) -- 하나의 100점 만점 점수로 통합한다. 사용자 평가 30%,
 * Vision AI 판단 70% 가중 평균(사용자 지시: "vision ai 판단을 70%로,
 * 사용자평가를 30% 비중으로"). Vision 판단이 없는 행(과거 데이터, 또는
 * best-effort 호출이 실패한 경우)은 어쩔 수 없이 사용자 평가 점수만으로
 * 판단한다 -- 이 유스케이스 자체는 Vision AI를 새로 호출하지 않으므로
 * (비용 0 원칙) 여기서 보정할 방법이 없다.
 */
export const USAGE_SCORE_WEIGHT = 0.3;
export const VISION_SCORE_WEIGHT = 0.7;

export function combineUsageAndVisionScore(usageScore: number, visionScore: number | null): number {
  if (visionScore == null) return usageScore;
  return Math.round((USAGE_SCORE_WEIGHT * usageScore + VISION_SCORE_WEIGHT * visionScore) * 100) / 100;
}

/**
 * 관리자 본인 계정(role="admin")으로 만든 생성물은 실제 고객이 아니라
 * 개발/테스트용이라 사용자 평가(좋아요/싫어요)를 일일이 남길 수 없다
 * (2026-07-25 사용자 지시: "내가 너한테 생성하라고 시킨 이미지들은
 * 내가 일일이 평가할 수 없으니 vision ai 100퍼센트 비중으로 해줘") --
 * 이런 행은 사용자 평가 점수를 아예 배제하고 Vision AI 판단만 그대로
 * 쓴다. Vision 판단이 없으면(드문 실패 케이스) 대체할 신호가 없으므로
 * 어쩔 수 없이 사용자 평가 점수(대부분 neutral)로 대체한다. 실제
 * 고객(role="designer") 소유 생성물은 기존 30/70 가중치를 그대로 쓴다.
 */
export function resolveGenerationScore(
  usageScore: number,
  visionScore: number | null,
  ownerIsAdmin: boolean,
): number {
  if (ownerIsAdmin) {
    return visionScore != null ? Math.round(visionScore * 100) / 100 : usageScore;
  }
  return combineUsageAndVisionScore(usageScore, visionScore);
}
