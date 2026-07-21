import type { Style } from "@/modules/styles/domain/Style";

export const MAX_SECONDARY_STYLES = 2;
export const MAX_RECOMMENDATIONS = 6;

/**
 * 12_PRD_StyleEngine.md "Style Combination Rules" example: 허용 - Swiss +
 * Minimal, Luxury + Serif / 비허용 - Ultra Minimal + Maximalism. Our
 * taxonomy doesn't have a literal "Maximalism" category, so this maps the
 * same intent onto the closest pair we do have: an intentionally sparse
 * Minimal(미니멀) 방향과 의도적으로 화려한 Playful(플레이풀) 방향은
 * 서로 모순된다. 카테고리 표시명이 한글로 바뀌어도(seedStyles.ts) 이 값이
 * 그대로 매칭되도록 대분류의 한글 name과 맞춰뒀다.
 */
const CONFLICTING_CATEGORIES: [string, string][] = [["미니멀", "플레이풀"]];

export function categoriesConflict(a: string, b: string): boolean {
  return CONFLICTING_CATEGORIES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

export interface ScoreInput {
  /** buildStyleCandidatesFromAnswers()의 결과, primary -> secondary 순서. */
  candidateCategoryNames: string[];
  /** 인터뷰 원문 답변(purpose/targetAudience/industry)에서 만든 자유 텍스트. */
  keywordText: string;
}

/**
 * Rule-based match score (12_PRD_StyleEngine.md "Recommendation Rules"):
 * 인터뷰 답변에서 추론한 후보 카테고리가 가장 큰 가중치를 가지고, 스타일
 * 자체 태그와의 키워드 중복이 보조 신호로 더해진다.
 */
export function scoreStyle(style: Style, input: ScoreInput): number {
  let score = 0;
  const categoryLower = style.category.toLowerCase();
  input.candidateCategoryNames.forEach((name, index) => {
    if (name.toLowerCase() === categoryLower) {
      score += index === 0 ? 0.6 : 0.35;
    }
  });

  const text = input.keywordText.toLowerCase();
  const matchedKeywords = style.keywords.filter((k) => text.includes(k.toLowerCase()));
  if (style.keywords.length > 0) {
    score += 0.2 * (matchedKeywords.length / style.keywords.length);
  }

  return Math.min(1, Math.round(score * 100) / 100);
}

export function buildRecommendationReason(style: Style, input: ScoreInput): string {
  const primaryMatch = input.candidateCategoryNames[0]?.toLowerCase() === style.category.toLowerCase();
  const text = input.keywordText.toLowerCase();
  const matchedKeywords = style.keywords.filter((k) => text.includes(k.toLowerCase()));

  if (primaryMatch) {
    return `인터뷰 답변에서 추론한 1순위 스타일 방향(${style.category})과 일치합니다.`;
  }
  if (matchedKeywords.length > 0) {
    return `브랜드 톤/성격과 일치하는 키워드(${matchedKeywords.join(", ")})가 있습니다.`;
  }
  return `${style.category} 계열의 대안으로 참고할 수 있는 스타일입니다.`;
}

interface ConflictCheckInput {
  primary: Style;
  secondaries: Style[];
}

export function findConflict(input: ConflictCheckInput): { a: Style; b: Style } | null {
  const all = [input.primary, ...input.secondaries];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]!;
      const b = all[j]!;
      if (categoriesConflict(a.category.toLowerCase(), b.category.toLowerCase())) {
        return { a, b };
      }
    }
  }
  return null;
}

// name은 seedStyles.ts의 대분류(Level-1) 한글 표시명과 정확히 일치해야
// scoreStyle의 카테고리 매칭 보너스가 실제로 적용된다("헤리티지"/"실험적"은
// 대분류가 아니라 중분류 개념이라 원래도 매칭되지 않았음 -- 그대로 둠).
// 원래 brandStrategies/domain/asterBrainRules.ts에 있던 메커니즘을 이곳으로
// 이동 -- 스타일 선택이 브랜드 전략보다 먼저 오는 새 순서에서는 브랜드
// 전략이 아니라 인터뷰 원문 답변에서 후보 카테고리를 뽑아야 하기 때문.
// interviewQuestions.ts의 DESIRED_IMPRESSION_OPTIONS 5개 문구를 실제로
// 매칭시키기 위해 그 문구 기준으로 패턴을 보강했다(전문적/신뢰, 활기/트렌디,
// 따뜻/편안 추가) -- "모던"도 더 이상 매칭 안 될 때만 나오는 기본값이 아니라
// 다른 7개와 동등하게 진짜로 매칭될 때만 나오는 후보가 되도록 자체 패턴을
// 추가했다(전문적/신뢰/정돈 계열).
const STYLE_TAXONOMY_KEYWORDS: { pattern: RegExp; name: string }[] = [
  { pattern: /미니멀|심플/, name: "미니멀" },
  { pattern: /럭셔리|고급|프리미엄/, name: "럭셔리" },
  { pattern: /빈티지|헤리티지|클래식/, name: "헤리티지" },
  { pattern: /테크|미래|디지털/, name: "테크" },
  { pattern: /경쾌|플레이풀|재미|트렌디|활기/, name: "플레이풀" },
  { pattern: /자연|오가닉|친환경|따뜻|편안/, name: "오가닉" },
  { pattern: /실험적|아방가르드/, name: "실험적" },
  { pattern: /전문적|신뢰|정돈/, name: "모던" },
];

/**
 * 인터뷰 원문 답변(purpose/targetAudience/industry/desiredImpression)에서
 * 후보 스타일 카테고리 2개를 추론한다 -- 브랜드 전략이 아직 없는 시점(인터뷰
 * 직후)에 스타일 추천의 스코어링 입력으로 쓰인다. desiredImpression(필수
 * 질문, 5개 고정 옵션)을 포함해야 실제로 인터뷰 내용에 따라 결과가 달라진다
 * -- 이전엔 purpose/targetAudience/industry 답변 문구에 이 키워드들이 전혀
 * 안 들어있어서 사실상 항상 "모던"(기본값)으로 떨어졌었다. primary/secondary는
 * "처음 매칭된 두 개의 서로 다른 카테고리"로 뽑고, 정말 아무 패턴도 안 걸리는
 * 예외적인 경우에만 기존 고정 페어(모던↔미니멀)를 안전망으로 쓴다.
 */
export function buildStyleCandidatesFromAnswers(answers: Record<string, string>): string[] {
  const text = [answers.purpose, answers.targetAudience, answers.industry, answers.desiredImpression]
    .filter(Boolean)
    .join(" ");
  const matches = STYLE_TAXONOMY_KEYWORDS.filter((k) => k.pattern.test(text)).map((k) => k.name);
  const distinct = [...new Set(matches)];
  const primary = distinct[0] ?? "모던";
  const secondary = distinct[1] ?? (primary === "모던" ? "미니멀" : "모던");
  return [primary, secondary];
}
