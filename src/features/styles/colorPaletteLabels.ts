import type { MessageKey } from "@/shared/i18n/messages/types";

// PRESET_COLOR_PALETTES(ColorPalette.ts)의 slug는 실제 저장/매칭 키로
// presetSlug에 그대로 쓰이므로 바꾸지 않는다 -- 화면에 보여줄 때만 이 표로
// 번역 문구를 찾는다(DELIVERABLE_TYPE_LABEL_KEYS와 동일한 패턴).
export const COLOR_PALETTE_LABEL_KEYS: Record<string, MessageKey> = {
  "warm-terracotta": "styles.colorPalettes.warmTerracotta",
  "deep-ocean": "styles.colorPalettes.deepOcean",
  "onyx-gold": "styles.colorPalettes.onyxGold",
  "forest-green": "styles.colorPalettes.forestGreen",
  "soft-pastel": "styles.colorPalettes.softPastel",
  monochrome: "styles.colorPalettes.monochrome",
  "vivid-pop": "styles.colorPalettes.vividPop",
  "earth-tone": "styles.colorPalettes.earthTone",
};
