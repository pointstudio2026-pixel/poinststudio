import type { Style } from "@/modules/styles/domain/Style";

export const MAX_SECONDARY_STYLES = 2;
export const MAX_RECOMMENDATIONS = 12;

/**
 * 12_PRD_StyleEngine.md "Style Combination Rules" example: 허용 - Swiss +
 * Minimal, Luxury + Serif / 비허용 - Ultra Minimal + Maximalism. Our
 * taxonomy doesn't have a literal "Maximalism" category, so this maps the
 * same intent onto the closest pair we do have: an intentionally sparse
 * Minimal direction directly contradicts a deliberately busy Playful one.
 */
const CONFLICTING_CATEGORIES: [string, string][] = [["minimal", "playful"]];

export function categoriesConflict(a: string, b: string): boolean {
  return CONFLICTING_CATEGORIES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

export interface ScoreInput {
  /** Task-010's styleCandidates, ordered primary -> secondary. */
  candidateCategoryNames: string[];
  /** Free text built from brand tone/personality/positioning/industry/values. */
  keywordText: string;
}

/**
 * Rule-based match score (12_PRD_StyleEngine.md "Recommendation Rules"):
 * Brand Strategy's style candidates carry the most weight (they were
 * already derived from the Brand Brief in Task-010), keyword overlap with
 * the style's own tags adds a smaller secondary signal.
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
    return `Brand Strategy가 추천한 1순위 스타일 방향(${style.category})과 일치합니다.`;
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
