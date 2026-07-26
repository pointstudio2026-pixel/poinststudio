/**
 * Interview answers -> Brand Knowledge mapping. Ported from the deleted
 * brandBriefs module's brandBriefRules.ts (that module used to sit between
 * the Interview and Aster Brain purely as a persisted, versioned copy of
 * this same deterministic inference -- brand_brief and brand_strategy
 * overlapped almost entirely, so Aster Brain now runs this directly on raw
 * interview answers instead of a separately generated/reviewed Brief).
 */

import type { Locale } from "@/shared/i18n/locale";
import { MESSAGES } from "@/shared/i18n/messages";
import {
  DESIRED_IMPRESSION_LABEL_KEYS,
  INDUSTRY_LABEL_KEYS,
  PURPOSE_LABEL_KEYS,
  TARGET_AUDIENCE_LABEL_KEYS,
  translateAnswerValue,
} from "@/modules/interviews/domain/interviewOptionLabels";

export interface BrandKnowledgeFields {
  industry: string;
  mission: string;
  vision: string;
  values: string[];
  positioning: string;
  audience: string;
  tone: string;
  personality: string;
  visualDirection: string;
  tagline: string;
  keywords: string[];
  preferredColor: string;
  typographyDirection: string;
}

function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,、·\/\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const TONE_KEYWORD_PATTERNS: { pattern: RegExp; toneKey: "warm" | "professional" | "premium" | "trendy" }[] = [
  { pattern: /편안|따뜻|아늑|친근/, toneKey: "warm" },
  { pattern: /전문|신뢰|정확/, toneKey: "professional" },
  { pattern: /고급|프리미엄|세련/, toneKey: "premium" },
  { pattern: /활기|젊|트렌디|재미/, toneKey: "trendy" },
];

// 키워드 매칭은 사용자가 실제로 입력한 한국어 인터뷰 답변(desiredImpression)을
// 대상으로 하므로 언어와 무관하게 항상 한국어 패턴으로 검사하고, 화면에
// 보여줄 결과 문구만 선택된 언어로 번역한다.
function inferTone(desiredImpression: string, locale: Locale): string {
  const match = TONE_KEYWORD_PATTERNS.find((k) => k.pattern.test(desiredImpression));
  const m = MESSAGES[locale].asterBrain;
  return match ? m[`tone_${match.toneKey}`] : m.tone_balanced;
}

/**
 * Deterministic, no AI involved -- fills the fields that genuinely need
 * inference (tagline/vision/positioning/tone/personality/keywords/visual
 * direction) with a topically-relevant placeholder derived from the 4
 * interview answers (brandName/industry/purpose/targetAudience).
 */
export function buildBrandKnowledgeFields(answers: Record<string, string>, locale: Locale = "ko"): BrandKnowledgeFields {
  const m = MESSAGES[locale].asterBrain;
  const brandName = answers.brandName ?? "";
  const industry = translateAnswerValue(answers.industry, INDUSTRY_LABEL_KEYS, locale);
  const mission = translateAnswerValue(answers.purpose, PURPOSE_LABEL_KEYS, locale);
  const primaryAudience = translateAnswerValue(answers.targetAudience, TARGET_AUDIENCE_LABEL_KEYS, locale);
  const coreValues = splitList(answers.coreValues);
  // inferTone()은 화면 표시용 번역과 무관하게 항상 원문 한국어 답변을 대상으로
  // 키워드 매칭해야 하므로(파일 상단 주석 참고) answers.desiredImpression을
  // 그대로 넘긴다 -- translateAnswerValue는 tagline(표시용) 조립에만 쓴다.
  const tone = inferTone(answers.desiredImpression ?? "", locale);

  const preferredColor = m.defaultPreferredColor;
  const typographyDirection = m.defaultTypography;
  const preferredStyle = m.defaultStyle;
  const preferredSymbol = m.defaultSymbol;

  return {
    industry,
    mission,
    vision: MESSAGES[locale].asterBrain.visionTemplate
      .replace("{brand}", brandName || m.fallbackBrand)
      .replace("{industry}", industry || m.fallbackIndustry)
      .replace("{audience}", primaryAudience || m.fallbackAudience),
    values: coreValues,
    positioning: MESSAGES[locale].asterBrain.positioningTemplate
      .replace("{industry}", industry || m.fallbackIndustryGeneric)
      .replace("{tone}", tone)
      .replace("{audience}", primaryAudience || m.fallbackTargetAudience),
    audience: primaryAudience,
    tone,
    personality: tone,
    visualDirection: [preferredStyle, preferredColor, preferredSymbol, typographyDirection].join(", "),
    tagline: `${brandName || m.fallbackBrandOwn} — ${translateAnswerValue(answers.desiredImpression, DESIRED_IMPRESSION_LABEL_KEYS, locale) || m.fallbackTagline}`,
    keywords: [industry, ...coreValues].filter(Boolean).slice(0, 5),
    preferredColor,
    typographyDirection,
  };
}
