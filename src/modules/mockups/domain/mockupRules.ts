import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

/**
 * MockupCategory는 닫힌 enum이라(LogoStyleCategory처럼 DB에서 관리할 필요가
 * 없음) 키워드를 코드에 정적으로 둔다 -- PRESET_COLOR_PALETTES와 동일한
 * 결정. 업종/목적 텍스트와의 키워드 중복으로 랭킹한다(추가 AI 호출 없음,
 * styleRules.ts/logoStyleRules.ts와 동일한 방식).
 */
export const MOCKUP_CATEGORY_KEYWORDS: Record<MockupCategory, string[]> = {
  business_card: ["명함", "B2B", "컨설팅", "영업", "네트워킹", "사무", "법률", "금융", "부동산"],
  signboard: ["매장", "카페", "식당", "레스토랑", "리테일", "오프라인", "간판", "상점", "숍"],
  mobile_app: ["앱", "IT", "테크", "스타트업", "서비스", "플랫폼", "소프트웨어", "핀테크"],
  website_hero: ["웹사이트", "온라인", "IT", "서비스", "플랫폼", "이커머스", "SaaS"],
  brochure: ["브로슈어", "카탈로그", "인테리어", "부동산", "상담", "안내", "리플렛", "소개서", "컨설팅"],
  poster: ["포스터", "홍보", "이벤트", "병원", "클리닉", "카페", "공고", "안내문", "캠페인"],
  package: ["패키지", "포장", "제품", "박스", "리테일", "F&B", "화장품", "식품", "커머스"],
  leaflet: ["리플렛", "전단", "홍보물", "안내", "이벤트", "캠페인", "행사", "소개"],
  banner: ["배너", "SNS", "광고", "온라인", "캠페인", "이벤트", "소셜", "마케팅"],
  uniform: ["유니폼", "앞치마", "카페", "매장", "레스토랑", "서비스업", "직원", "리테일"],
};

/**
 * "완성된 결과물"(포스터/브로슈어 등)을 만드는 deliverableType은 목업
 * 스튜디오에서 대응하는 카테고리 하나만 보여준다(명함 프로젝트에 웹사이트
 * 목업이 뜰 이유가 없음) -- 값이 없는 deliverableType(브랜딩 & 로고, 또는
 * null/레거시 프로젝트)은 매핑하지 않고 기존처럼 전체 카테고리를 노출한다
 * (로고 마크만 만들어지므로 어느 목업에나 올릴 수 있다). signboard/banner/
 * uniform은 특정 작업물유형 전용이 아니라 로고 마크 프로젝트 전반에 두루
 * 어울리는 "보너스" 카테고리라 의도적으로 매핑하지 않는다.
 */
export const DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY: Partial<Record<string, MockupCategory>> = {
  명함: "business_card",
  웹사이트: "website_hero",
  "앱 디자인": "mobile_app",
  포스터: "poster",
  브로슈어: "brochure",
  패키지: "package",
  리플렛: "leaflet",
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

/**
 * 카테고리별 연출/촬영 지침 (2026-07-25 신설, 2025 디자인 트렌드 리서치
 * 반영). 로고/디자인 시안 자체는 절대 다시 그리지 않고 그대로 유지하는 게
 * OpenAIMockupRenderProvider의 기본 원칙이라(첨부 이미지 그대로 합성), 여기
 * 문구는 로고가 아니라 "그 로고를 둘러싼 장면·연출·조명·소품"만 다룬다.
 * DB 참고/회피 문구(referenceExampleText/avoidPatternText)가 이 뒤에 추가로
 * 붙는 구조이므로, 여기는 카테고리마다 항상 참인 기본 연출 뼈대만 담는다.
 */
export const MOCKUP_CATEGORY_SCENE_TEMPLATES: Record<MockupCategory, string> = {
  business_card:
    "매트 또는 리넨 질감이 느껴지는 고급스러운 명함이 대리석·콘크리트·원목 중 " +
    "브랜드 톤에 어울리는 표면 위에 비스듬히 놓인 장면. 스튜디오 조명과 얕은 " +
    "피사계심도로 배경은 은은하게 흐리고, 다크 미니멀 또는 내추럴 어시 톤 중 " +
    "브랜드에 맞는 무드로 연출한다.",
  signboard:
    "매장 외벽에 설치된 간판이 자연광 아래 촬영된 실사 사진. 큼직하고 읽기 쉬운 " +
    "타이포그래피, 절제된 색상 팔레트, 넉넉한 여백을 갖춘 미니멀한 사이니지 " +
    "스타일로, 주변 건축 요소와 자연스럽게 어우러지게 연출한다.",
  mobile_app:
    "실제 스마트폰 기기 프레임 안에 앱 UI 화면이 표시된 장면. 카드 기반 레이아웃과 " +
    "넉넉한 여백, 부드러운 그림자로 은은한 입체감(소프트 UI)을 살리고, 손에 들려 " +
    "있거나 책상 위에 자연스럽게 놓인 구도로 촬영한다.",
  website_hero:
    "노트북 화면에 표시된 웹사이트 히어로 섹션이 책상 위 작업 공간에서 촬영된 " +
    "장면. 명확한 그리드와 큼직한 타이포그래피가 화면을 채우는 임팩트 있는 " +
    "구도로, 브랜드 톤에 따라 절제된 팔레트 또는 대담한 컬러 중 한 방향으로 " +
    "일관되게 연출한다.",
  brochure:
    "테이블 위에 놓인 브로슈어 표지가 촬영된 장면. 에디토리얼 감각의 절제된 " +
    "연출과 여백을 살리고, 펜이나 커피컵 같은 소품을 은은하게 곁들여 실제 " +
    "사용 맥락을 자연스럽게 암시한다.",
  poster:
    "벽에 부착된 포스터가 자연광 또는 실내 조명 아래 촬영된 장면. 대담한 색 " +
    "대비와 큼직한 타이포그래피가 두드러지는 구도로, 실제 인쇄물처럼 또렷하고 " +
    "정돈된 느낌을 살린다.",
  package:
    "제품 패키지가 테이블 위에 놓인 사실적인 스튜디오 사진. 무광·유광·크래프트지 " +
    "등 재질감이 살아있게 표현하고, 스튜디오 조명과 자연스러운 그림자로 입체감을 " +
    "살리며, 브랜드 톤에 따라 절제된 미니멀 또는 볼드한 컬러블로킹 중 한 방향으로 " +
    "연출한다.",
  leaflet:
    "손에 들려 있거나 테이블 위에 놓인 리플렛이 촬영된 장면. 접힌 상태의 입체감이 " +
    "자연스럽게 드러나고, 깔끔한 레이아웃과 명확한 타이포그래피 위계가 실제 " +
    "인쇄물처럼 정돈되어 보이게 연출한다.",
  banner:
    "스마트폰 화면 속 SNS 피드에 표시된 광고 배너 이미지 장면. 각진 기하학적 " +
    "레이아웃과 선명한 컬러 대비가 눈에 띄는 구도로, 짧은 시선에도 핵심 메시지가 " +
    "바로 읽히게 연출한다.",
  uniform:
    "앞치마 또는 유니폼이 옷걸이에 걸려 있거나 자연스럽게 착용된 장면. 은은한 " +
    "자수 또는 프린트 형태로 가슴 부분에 브랜딩이 절제되게 위치하고, 어시 " +
    "뉴트럴 톤(모카·올리브·세이지·차콜) 배경으로 차분하게 연출한다.",
};

export function buildMockupCategorySceneDirective(category: MockupCategory): string {
  return MOCKUP_CATEGORY_SCENE_TEMPLATES[category] ?? "";
}
