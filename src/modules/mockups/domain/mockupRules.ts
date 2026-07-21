import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

/**
 * MockupCategory는 닫힌 10개 enum이라(LogoStyleCategory처럼 DB에서 관리할
 * 필요가 없음) 키워드를 코드에 정적으로 둔다 -- PRESET_COLOR_PALETTES와
 * 동일한 결정. 업종/목적 텍스트와의 키워드 중복으로 랭킹한다(추가 AI 호출
 * 없음, styleRules.ts/logoStyleRules.ts와 동일한 방식).
 */
export const MOCKUP_CATEGORY_KEYWORDS: Record<MockupCategory, string[]> = {
  business_card: ["명함", "B2B", "컨설팅", "영업", "네트워킹", "사무", "법률", "금융", "부동산"],
  stationery: ["문구", "오피스", "사무", "레터헤드", "다이어리", "스튜디오", "에이전시"],
  signboard: ["매장", "카페", "식당", "레스토랑", "리테일", "오프라인", "간판", "상점", "숍"],
  packaging: ["화장품", "뷰티", "식품", "제품", "패키지", "포장", "코스메틱", "스킨케어", "건강기능식품"],
  coffee_cup: ["카페", "커피", "음료", "베이커리", "디저트", "브런치", "로스터리"],
  shopping_bag: ["리테일", "쇼핑", "편집숍", "매장", "패션", "부티크", "선물", "기념품"],
  t_shirt: ["패션", "의류", "어패럴", "굿즈", "브랜드 상품", "스트릿", "캐주얼"],
  mobile_app: ["앱", "IT", "테크", "스타트업", "서비스", "플랫폼", "소프트웨어", "핀테크"],
  website_hero: ["웹사이트", "온라인", "IT", "서비스", "플랫폼", "이커머스", "SaaS"],
  social_media: ["마케팅", "SNS", "온라인", "브랜드", "인플루언서", "콘텐츠", "커머스"],
};

export interface MockupCategoryScoreInput {
  /** 인터뷰 답변(industry/purpose/targetAudience) + deliverableType을 합친 자유 텍스트. */
  keywordText: string;
}

export interface MockupCategoryRecommendation {
  category: MockupCategory;
  score: number;
  reason: string;
}

export function scoreMockupCategory(category: MockupCategory, input: MockupCategoryScoreInput): number {
  const keywords = MOCKUP_CATEGORY_KEYWORDS[category];
  if (keywords.length === 0) return 0;
  const text = input.keywordText.toLowerCase();
  const matched = keywords.filter((k) => text.includes(k.toLowerCase()));
  return Math.round((matched.length / keywords.length) * 100) / 100;
}

export function buildMockupRecommendationReason(
  category: MockupCategory,
  input: MockupCategoryScoreInput,
): string {
  const keywords = MOCKUP_CATEGORY_KEYWORDS[category];
  const text = input.keywordText.toLowerCase();
  const matched = keywords.filter((k) => text.includes(k.toLowerCase()));
  if (matched.length > 0) {
    return `브랜드 정보와 일치하는 키워드(${matched.join(", ")})를 바탕으로 추천합니다.`;
  }
  return "다양한 브랜드에 두루 어울리는 목업입니다.";
}

/** 점수 내림차순 -- 동점이면 MOCKUP_CATEGORIES 원래 순서를 유지한다(안정 정렬). */
export function rankMockupCategories(
  categories: MockupCategory[],
  input: MockupCategoryScoreInput,
): MockupCategoryRecommendation[] {
  return categories
    .map((category) => ({
      category,
      score: scoreMockupCategory(category, input),
      reason: buildMockupRecommendationReason(category, input),
    }))
    .sort((a, b) => b.score - a.score);
}
