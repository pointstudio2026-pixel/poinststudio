import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { GeneratedImage } from "@/modules/generations/domain/Generation";
import type { Style } from "@/modules/styles/domain/Style";
import { CONCEPT_BOARD_SECTIONS, type ColorSwatch, type ConceptBoardData } from "@/modules/conceptBoards/domain/ConceptBoard";

const COLOR_KEYWORD_RULES: { pattern: RegExp; swatches: ColorSwatch[] }[] = [
  {
    pattern: /따뜻|웜|주황|베이지|따스/,
    swatches: [
      { hex: "#7c2d12", label: "Warm Terracotta" },
      { hex: "#f97316", label: "Amber" },
      { hex: "#fef3c7", label: "Cream" },
    ],
  },
  {
    pattern: /차갑|시원|블루|청량/,
    swatches: [
      { hex: "#0c4a6e", label: "Deep Ocean" },
      { hex: "#0ea5e9", label: "Sky Blue" },
      { hex: "#e0f2fe", label: "Ice" },
    ],
  },
  {
    pattern: /고급|프리미엄|럭셔리|세련/,
    swatches: [
      { hex: "#1c1917", label: "Onyx" },
      { hex: "#a16207", label: "Gold" },
      { hex: "#f5f5f4", label: "Pearl" },
    ],
  },
  {
    pattern: /자연|그린|친환경|오가닉/,
    swatches: [
      { hex: "#14532d", label: "Forest Green" },
      { hex: "#84cc16", label: "Fresh Lime" },
      { hex: "#f7fee7", label: "Sage Mist" },
    ],
  },
];

const DEFAULT_SWATCHES: ColorSwatch[] = [
  { hex: "#1f2937", label: "Charcoal" },
  { hex: "#9ca3af", label: "Stone Gray" },
  { hex: "#f9fafb", label: "Off White" },
];

function buildColorPalette(preferredColor: string, brandTone: string): ColorSwatch[] {
  const text = `${preferredColor} ${brandTone}`;
  const rule = COLOR_KEYWORD_RULES.find((r) => r.pattern.test(text));
  return rule?.swatches ?? DEFAULT_SWATCHES;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * "Concept Board는 단순 이미지 갤러리가 아니라 브랜드 제안서이다. 모든 요소는
 * Brand Strategy를 기준으로 구성한다." -- purely rule-based aggregation of
 * already-AI-derived upstream data (Interview/Strategy/Style/Generation),
 * no additional AI call needed here.
 */
export function composeConceptBoardData(input: {
  answers: Record<string, string>;
  strategy: BrandStrategyData;
  primaryStyle: Style | null;
  secondaryStyles: Style[];
  latestGenerationImages: GeneratedImage[] | null;
  /** 스타일 화면에서 미리 선택한 컬러(있으면 최우선 -- 실제 프롬프트와 100% 일치). */
  selectedColorPalette: ColorSwatch[] | null;
  /** 선택이 없을 때, 실제 생성된 히어로 이미지에서 뽑아낸 지배색. */
  extractedColorPalette: ColorSwatch[] | null;
}): ConceptBoardData {
  const { strategy, answers } = input;
  const knowledge = strategy.brandKnowledge;
  const brandName = answers.brandName ?? "";
  const industry = answers.industry ?? "";

  const brandSummary =
    `${brandName}는 ${industry} 분야에서 ${strategy.brandStrategy.brandArchetype} 정체성을 바탕으로, ` +
    `${strategy.brandStrategy.toneAndManner} 톤으로 ${knowledge.audience || "타깃 고객"}에게 다가가는 브랜드입니다. ` +
    `${knowledge.tagline}`;

  const styleKeywords = dedupe([
    ...knowledge.keywords,
    ...(input.primaryStyle ? [input.primaryStyle.name] : []),
    ...input.secondaryStyles.map((s) => s.name),
  ]);

  const images = input.latestGenerationImages ?? [];

  return {
    heroImageUrl: images[0]?.url ?? null,
    brandSummary,
    coreValues: knowledge.values,
    styleKeywords,
    colorPalette:
      input.selectedColorPalette ??
      input.extractedColorPalette ??
      buildColorPalette(knowledge.preferredColor, knowledge.tone),
    typographyDirection: knowledge.typographyDirection,
    logoConceptImageUrls: images.slice(0, 3).map((img) => img.url),
    designNotes: knowledge.reasoningSummary,
    sectionOrder: [...CONCEPT_BOARD_SECTIONS],
  };
}
