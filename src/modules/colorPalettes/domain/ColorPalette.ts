import type { ColorSwatch } from "@/modules/conceptBoards/domain/ConceptBoard";

export type { ColorSwatch };

export interface ColorPalette {
  slug: string;
  name: string;
  swatches: ColorSwatch[];
}

/**
 * 큐레이션된 프리셋 팔레트 카탈로그 -- conceptBoardComposer.ts의 기존
 * COLOR_KEYWORD_RULES 4종(웜 테라코타/딥 오션/골드&오닉스/포레스트 그린)을
 * 그대로 승격시키고 파스텔/모노크롬/비비드/어스톤을 더했다. 닫힌 정적
 * 목록이라 DB 시딩 없이 코드에 직접 둔다(작업물 유형처럼 열거형 성격).
 */
export const PRESET_COLOR_PALETTES: ColorPalette[] = [
  {
    slug: "warm-terracotta",
    name: "따뜻한 벽돌색",
    swatches: [
      { hex: "#7c2d12", label: "Warm Terracotta" },
      { hex: "#f97316", label: "Amber" },
      { hex: "#fef3c7", label: "Cream" },
    ],
  },
  {
    slug: "deep-ocean",
    name: "짙은 바다색",
    swatches: [
      { hex: "#0c4a6e", label: "Deep Ocean" },
      { hex: "#0ea5e9", label: "Sky Blue" },
      { hex: "#e0f2fe", label: "Ice" },
    ],
  },
  {
    slug: "onyx-gold",
    name: "검정 & 금빛",
    swatches: [
      { hex: "#1c1917", label: "Onyx" },
      { hex: "#a16207", label: "Gold" },
      { hex: "#f5f5f4", label: "Pearl" },
    ],
  },
  {
    slug: "forest-green",
    name: "짙은 숲색",
    swatches: [
      { hex: "#14532d", label: "Forest Green" },
      { hex: "#84cc16", label: "Fresh Lime" },
      { hex: "#f7fee7", label: "Sage Mist" },
    ],
  },
  {
    slug: "soft-pastel",
    name: "은은한 파스텔",
    swatches: [
      { hex: "#fbcfe8", label: "Blush Pink" },
      { hex: "#bfdbfe", label: "Baby Blue" },
      { hex: "#fef9c3", label: "Butter" },
    ],
  },
  {
    slug: "monochrome",
    name: "무채색(흑백)",
    swatches: [
      { hex: "#171717", label: "Ink" },
      { hex: "#737373", label: "Stone" },
      { hex: "#fafafa", label: "Snow" },
    ],
  },
  {
    slug: "vivid-pop",
    name: "선명한 원색",
    swatches: [
      { hex: "#dc2626", label: "Vivid Red" },
      { hex: "#facc15", label: "Vivid Yellow" },
      { hex: "#2563eb", label: "Vivid Blue" },
    ],
  },
  {
    slug: "earth-tone",
    name: "흙빛 브라운",
    swatches: [
      { hex: "#78350f", label: "Umber" },
      { hex: "#d6b98c", label: "Sand" },
      { hex: "#f5f0e6", label: "Linen" },
    ],
  },
];

export function findPresetColorPalette(slug: string): ColorPalette | undefined {
  return PRESET_COLOR_PALETTES.find((p) => p.slug === slug);
}
