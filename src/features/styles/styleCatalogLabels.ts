import type { MessageKey } from "@/shared/i18n/messages/types";

// seedStyles.ts의 L1_CATEGORIES/L2_BY_CATEGORY/L3_MODIFIERS는 Korean name을
// 실제 저장/매칭 키(style.name, style.category)로 그대로 쓰므로 바꾸지 않는다
// -- 화면에 보여줄 때만 이 표로 번역 문구를 찾는다(COLOR_PALETTE_LABEL_KEYS와
// 동일한 패턴). 레벨3(소분류) 이름은 항상 "${L2.name} ${modifier.name}"로
// 결정적으로 조합되므로, 152개를 전부 등록하는 대신 L2/modifier 두 개의 작은
// 표만 있으면 충분하다.
export const STYLE_L1_LABEL_KEYS: Record<string, MessageKey> = {
  모던: "styles.styleCatalog.l1_modern",
  클래식: "styles.styleCatalog.l1_classic",
  럭셔리: "styles.styleCatalog.l1_luxury",
  미니멀: "styles.styleCatalog.l1_minimal",
  플레이풀: "styles.styleCatalog.l1_playful",
  테크: "styles.styleCatalog.l1_tech",
  오가닉: "styles.styleCatalog.l1_organic",
  에디토리얼: "styles.styleCatalog.l1_editorial",
};

export const STYLE_L2_LABEL_KEYS: Record<string, MessageKey> = {
  스위스: "styles.styleCatalog.l2_swiss",
  지오메트릭: "styles.styleCatalog.l2_geometric",
  코퍼레이트: "styles.styleCatalog.l2_corporate",
  헤리티지: "styles.styleCatalog.l2_heritage",
  빈티지: "styles.styleCatalog.l2_vintage",
  트래디셔널: "styles.styleCatalog.l2_traditional",
  프리미엄: "styles.styleCatalog.l2_premium",
  엘레강스: "styles.styleCatalog.l2_elegant",
  부티크: "styles.styleCatalog.l2_boutique",
  스칸디나비안: "styles.styleCatalog.l2_scandinavian",
  모노크롬: "styles.styleCatalog.l2_monochrome",
  화이트스페이스: "styles.styleCatalog.l2_whitespace",
  팝: "styles.styleCatalog.l2_pop",
  위트: "styles.styleCatalog.l2_whimsical",
  컬러풀: "styles.styleCatalog.l2_colorful",
  퓨처리스틱: "styles.styleCatalog.l2_futuristic",
  사이버: "styles.styleCatalog.l2_cyber",
  데이터드리븐: "styles.styleCatalog.l2_dataDriven",
  보태니컬: "styles.styleCatalog.l2_botanical",
  핸드크래프트: "styles.styleCatalog.l2_handcrafted",
  어스톤: "styles.styleCatalog.l2_earthy",
  매거진: "styles.styleCatalog.l2_magazine",
  타이포그래픽: "styles.styleCatalog.l2_typographic",
  파인아트: "styles.styleCatalog.l2_fineArt",
};

export const STYLE_MODIFIER_LABEL_KEYS: Record<string, MessageKey> = {
  볼드: "styles.styleCatalog.mod_bold",
  소프트: "styles.styleCatalog.mod_soft",
  지오메트릭: "styles.styleCatalog.mod_geometric",
  웜: "styles.styleCatalog.mod_warm",
  쿨: "styles.styleCatalog.mod_cool",
};

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/**
 * style.name을 화면에 표시할 번역 문구로 바꾼다. 레벨0/1은 L1 표에서, 레벨2는
 * L2 표에서 바로 찾고, 레벨3(소분류)은 마지막 공백을 기준으로
 * "${L2 이름} ${modifier 이름}"을 나눠 각각 번역한 뒤 다시 합친다. 표에 없는
 * 값이 들어오면(데이터 불일치 등) 절대 던지지 않고 원래 한국어 문자열을 그대로
 * 보여준다.
 */
export function translateStyleName(style: { name: string; level: 0 | 1 | 2 | 3 }, t: Translate): string {
  if (style.level === 0 || style.level === 1) {
    const key = STYLE_L1_LABEL_KEYS[style.name];
    return key ? t(key) : style.name;
  }
  if (style.level === 2) {
    const key = STYLE_L2_LABEL_KEYS[style.name];
    return key ? t(key) : style.name;
  }
  const lastSpace = style.name.lastIndexOf(" ");
  if (lastSpace === -1) return style.name;
  const l2Part = style.name.slice(0, lastSpace);
  const modPart = style.name.slice(lastSpace + 1);
  const l2Key = STYLE_L2_LABEL_KEYS[l2Part];
  const modKey = STYLE_MODIFIER_LABEL_KEYS[modPart];
  if (l2Key && modKey) return `${t(l2Key)} ${t(modKey)}`;
  return style.name;
}

/** style.category(항상 L1 이름)를 화면에 표시할 번역 문구로 바꾼다. */
export function translateStyleCategory(categoryName: string, t: Translate): string {
  const key = STYLE_L1_LABEL_KEYS[categoryName];
  return key ? t(key) : categoryName;
}

/**
 * style.description을 원문 그대로 보여주는 대신, seedStyles.ts가 만든 문장
 * 패턴(descL1/descL2/descL3)을 번역된 l1/l2/modifier 조각으로 다시 조립한다.
 * 절대 번역되지 않은 한국어 조각을 템플릿에 그대로 꽂아 넣지 않는다 -- 파싱에
 * 실패하면 빈 문자열로 대체한다.
 */
export function translateStyleDescription(
  style: { level: 0 | 1 | 2 | 3; name: string; category: string },
  t: Translate,
): string {
  const l1 = translateStyleCategory(style.category, t);

  if (style.level === 0) return "";

  if (style.level === 1) {
    return t("styles.styleCatalog.descL1", { l1 });
  }

  if (style.level === 2) {
    const l2Key = STYLE_L2_LABEL_KEYS[style.name];
    if (!l2Key) return "";
    return t("styles.styleCatalog.descL2", { l1, l2: t(l2Key) });
  }

  const lastSpace = style.name.lastIndexOf(" ");
  if (lastSpace === -1) return "";
  const l2Part = style.name.slice(0, lastSpace);
  const modPart = style.name.slice(lastSpace + 1);
  const l2Key = STYLE_L2_LABEL_KEYS[l2Part];
  const modKey = STYLE_MODIFIER_LABEL_KEYS[modPart];
  if (!l2Key || !modKey) return "";
  return t("styles.styleCatalog.descL3", { l1, l2: t(l2Key), modifier: t(modKey) });
}
