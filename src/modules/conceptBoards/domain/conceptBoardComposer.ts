import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { GeneratedImage } from "@/modules/generations/domain/Generation";
import type { Style } from "@/modules/styles/domain/Style";
import { CONCEPT_BOARD_SECTIONS, type ColorSwatch, type ConceptBoardData } from "@/modules/conceptBoards/domain/ConceptBoard";
import {
  INDUSTRY_LABEL_KEYS,
  TARGET_AUDIENCE_LABEL_KEYS,
  translateAnswerValue,
} from "@/modules/interviews/domain/interviewOptionLabels";
import type { Locale } from "@/shared/i18n/locale";
import { MESSAGES } from "@/shared/i18n/messages";
import type { MessageKey } from "@/shared/i18n/messages/types";
import { translateStyleName } from "@/features/styles/styleCatalogLabels";

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
  /** brandSummary/styleKeywords 등 화면 표시용 문구를 조립할 언어 -- 기본값 "ko". */
  locale?: Locale;
}): ConceptBoardData {
  const { strategy, answers } = input;
  const locale = input.locale ?? "ko";
  const knowledge = strategy.brandKnowledge;
  const m = MESSAGES[locale].asterBrain;
  const brandName = answers.brandName ?? "";
  // answers.industry는 인터뷰 원문(한국어) 그대로 저장된 값이라 브랜드 요약
  // 문장에 꽂기 전에 항상 번역한다 -- knowledge.industry는 Brand Strategy 생성
  // 시점의 locale로 이미 굳어진 값이라(다국어 전환 이후 재사용 시 stale할 수
  // 있음) 여기서는 매번 현재 locale로 다시 번역한다.
  const industry = translateAnswerValue(answers.industry, INDUSTRY_LABEL_KEYS, locale);
  const audience =
    translateAnswerValue(answers.targetAudience, TARGET_AUDIENCE_LABEL_KEYS, locale) ||
    knowledge.audience ||
    m.fallbackTargetAudience;

  const brandSummary = MESSAGES[locale].conceptBoard.brandSummaryTemplate
    .replace("{brand}", brandName)
    .replace("{industry}", industry)
    .replace("{archetype}", strategy.brandStrategy.brandArchetype)
    .replace("{tone}", strategy.brandStrategy.toneAndManner)
    .replace("{audience}", audience)
    .replace("{tagline}", knowledge.tagline);

  // 서버 도메인 계층에는 LocaleProvider의 useTranslation()이 없어서, 같은
  // 시그니처((key, params?) => string)의 즉석 t를 만들어 translateStyleName에
  // 그대로 넘긴다(styleCatalogLabels.ts는 React 의존성 없는 순수 함수라
  // 도메인 계층에서 가져다 써도 안전 -- "use client" 없음, 확인함).
  const t = (key: MessageKey): string => {
    const value = key.split(".").reduce<unknown>((node, segment) => {
      if (node && typeof node === "object" && segment in node) {
        return (node as Record<string, unknown>)[segment];
      }
      return undefined;
    }, MESSAGES[locale] as unknown);
    return typeof value === "string" ? value : key;
  };

  const styleKeywords = dedupe([
    ...knowledge.keywords,
    ...(input.primaryStyle ? [translateStyleName(input.primaryStyle, t)] : []),
    ...input.secondaryStyles.map((s) => translateStyleName(s, t)),
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
