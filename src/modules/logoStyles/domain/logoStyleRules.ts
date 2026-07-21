import type { LogoStyleCategory, LogoStyleRecommendation } from "@/modules/logoStyles/domain/LogoStyle";

export const MAX_LOGO_STYLE_SELECTIONS = 3;

export interface LogoStyleScoreInput {
  /** Brand Strategy의 brandKnowledge/brandStrategy에서 뽑은 자유 텍스트(톤/성격/포지셔닝/아키타입). */
  brandText: string;
}

/**
 * Rule-based keyword match against each category's `keywords` -- no extra
 * AI call for this step (사용자가 "생성형 AI" 태그를 붙인 단계는 브랜드
 * 전략/이미지 생성/목업뿐이라, 로고 스타일 추천은 스타일 추천과 동일하게
 * 결정론적으로 처리한다).
 */
export function scoreLogoStyleCategory(category: LogoStyleCategory, input: LogoStyleScoreInput): number {
  const text = input.brandText.toLowerCase();
  const matched = category.keywords.filter((k) => text.includes(k.toLowerCase()));
  if (category.keywords.length === 0) return 0;
  return Math.round((matched.length / category.keywords.length) * 100) / 100;
}

export function buildLogoStyleReason(category: LogoStyleCategory, input: LogoStyleScoreInput): string {
  const text = input.brandText.toLowerCase();
  const matched = category.keywords.filter((k) => text.includes(k.toLowerCase()));
  if (matched.length > 0) {
    return `브랜드 톤/포지셔닝과 일치하는 키워드(${matched.join(", ")})를 바탕으로 "${category.name}" 방향을 추천합니다.`;
  }
  return `"${category.name}"은(는) 다양한 브랜드에 두루 어울리는 방향입니다.`;
}

/**
 * 5개 구조 카테고리를 브랜드 텍스트 기준으로 랭킹한다. "AI 추천" 카드는 이
 * 결과의 상위 3개(각 카테고리의 대표 서브스타일 하나씩)를 보여주는
 * 화면 위젯일 뿐, 별도 DB 카테고리가 아니다.
 */
export function rankLogoStyleCategories(
  categories: LogoStyleCategory[],
  input: LogoStyleScoreInput,
): LogoStyleRecommendation[] {
  return categories
    .map((category) => ({
      category,
      score: scoreLogoStyleCategory(category, input),
      reason: buildLogoStyleReason(category, input),
      representativeSubStyle: category.subStyles[0] ?? category.name,
    }))
    .sort((a, b) => b.score - a.score);
}
