/**
 * DB 추천이 사용자 하드제약과 충돌해서 버려질 때, 그 추천이 노리던
 * "목적"을 다른 디자인 요소로 대체하는 결정론적 매핑. AI 호출 없음 --
 * promptBuilder.ts의 STYLE_CATEGORY_TEMPLATES와 같은 결의 고정 어휘를
 * 재사용한다. 알려진 목적 키워드가 없으면 일반 대체 문구로 폴백한다
 * (절대 빈 문자열을 반환하지 않는다).
 */
const GOAL_PRESERVATION_FALLBACKS: Record<string, string> = {
  프리미엄: "넉넉한 여백과 절제된 타이포그래피 위계로 고급스러움을 표현한다.",
  고급: "넉넉한 여백과 절제된 타이포그래피 위계로 고급스러움을 표현한다.",
  신뢰: "안정적인 정렬과 명확한 구조로 신뢰감을 표현한다.",
  전문: "안정적인 정렬과 명확한 구조로 신뢰감을 표현한다.",
  활기: "강한 대비와 다이나믹한 구성으로 활력을 표현한다.",
  경쾌: "강한 대비와 다이나믹한 구성으로 활력을 표현한다.",
  따뜻: "부드러운 곡선과 넉넉한 여백으로 따뜻한 인상을 표현한다.",
  친근: "부드러운 곡선과 넉넉한 여백으로 친근한 인상을 표현한다.",
  차분: "낮은 채도와 절제된 대비로 차분한 인상을 표현한다.",
  안정: "낮은 채도와 절제된 대비로 안정적인 인상을 표현한다.",
};

function findFallback(reason: string): string | null {
  const lower = reason.toLowerCase();
  for (const [keyword, fallback] of Object.entries(GOAL_PRESERVATION_FALLBACKS)) {
    if (lower.includes(keyword.toLowerCase())) return fallback;
  }
  return null;
}

/** DB 추천이 버려질 때 그 추천의 목적(reason 텍스트)을 대체할 문구를 만든다. 항상 비어있지 않은 문자열을 반환한다. */
export function preserveGoal(discardedReason: string): string {
  const matched = findFallback(discardedReason);
  if (matched) return matched;
  return `이 방향의 목적은 색상 대신 구성·타이포그래피로 표현한다.`;
}
