import type { MessageKey } from "@/shared/i18n/messages/types";

// seedLogoStyles.ts(CATEGORIES)의 slug는 실제 저장/식별 키(LogoStyleCategoryDto.slug)로
// 그대로 쓰이므로 바꾸지 않는다 -- 화면에 보여줄 때만 이 표로 번역 문구를
// 찾는다(COLOR_PALETTE_LABEL_KEYS와 동일한 패턴).
export const LOGO_STYLE_CATEGORY_NAME_KEYS: Record<string, MessageKey> = {
  typography: "logoStyle.categoryName_typography",
  symbol: "logoStyle.categoryName_symbol",
  illustration: "logoStyle.categoryName_illustration",
  combination: "logoStyle.categoryName_combination",
  premium: "logoStyle.categoryName_premium",
};

export const LOGO_STYLE_CATEGORY_DESC_KEYS: Record<string, MessageKey> = {
  typography: "logoStyle.categoryDesc_typography",
  symbol: "logoStyle.categoryDesc_symbol",
  illustration: "logoStyle.categoryDesc_illustration",
  combination: "logoStyle.categoryDesc_combination",
  premium: "logoStyle.categoryDesc_premium",
};

// CATEGORIES[*].subStyles(seedLogoStyles.ts)의 26개 한국어 태그 전체를
// 키로 쓴다 -- 저장값 자체는 한국어 문자열이라 바꾸지 않는다.
export const LOGO_STYLE_TAG_KEYS: Record<string, MessageKey> = {
  워드마크: "logoStyle.tag_wordmark",
  레터마크: "logoStyle.tag_lettermark",
  모노그램: "logoStyle.tag_monogram",
  "한글 타이포": "logoStyle.tag_hangulTypography",
  캘리그라피: "logoStyle.tag_calligraphy",
  시그니처: "logoStyle.tag_signature",
  "미니멀 심볼": "logoStyle.tag_minimalSymbol",
  "기하학 심볼": "logoStyle.tag_geometricSymbol",
  "추상 심볼": "logoStyle.tag_abstractSymbol",
  픽토그램: "logoStyle.tag_pictogram",
  "라인 심볼": "logoStyle.tag_lineSymbol",
  "플랫 심볼": "logoStyle.tag_flatSymbol",
  "일러스트 심볼": "logoStyle.tag_illustratedSymbol",
  마스코트: "logoStyle.tag_mascot",
  동물: "logoStyle.tag_animal",
  식물: "logoStyle.tag_plant",
  오브젝트: "logoStyle.tag_object",
  "심볼 + 워드마크": "logoStyle.tag_symbolWordmark",
  엠블럼: "logoStyle.tag_emblem",
  원형: "logoStyle.tag_circular",
  프레임: "logoStyle.tag_frame",
  "커스텀 조합": "logoStyle.tag_customCombination",
  "네거티브 스페이스": "logoStyle.tag_negativeSpace",
  그라디언트: "logoStyle.tag_gradient",
  "3D": "logoStyle.tag_3d",
  패턴: "logoStyle.tag_pattern",
};

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/** LogoStyleCategoryDto.name(한국어)을 slug로 찾아 번역한다. 없으면 원문 유지. */
export function translateLogoStyleCategoryName(slug: string, name: string, t: Translate): string {
  const key = LOGO_STYLE_CATEGORY_NAME_KEYS[slug];
  return key ? t(key) : name;
}

/** LogoStyleCategoryDto.description(한국어)을 slug로 찾아 번역한다. 없으면 원문 유지. */
export function translateLogoStyleCategoryDescription(slug: string, description: string, t: Translate): string {
  const key = LOGO_STYLE_CATEGORY_DESC_KEYS[slug];
  return key ? t(key) : description;
}

/** subStyles 태그 하나(한국어)를 번역한다. 표에 없으면 원문 유지. */
export function translateLogoStyleTag(tag: string, t: Translate): string {
  const key = LOGO_STYLE_TAG_KEYS[tag];
  return key ? t(key) : tag;
}
