import type { BrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import { buildBrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import type {
  BrandKnowledge,
  BrandStrategyData,
  BrandStrategyProfile,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Locale } from "@/shared/i18n/locale";
import { MESSAGES } from "@/shared/i18n/messages";
import {
  INDUSTRY_LABEL_KEYS,
  TARGET_AUDIENCE_LABEL_KEYS,
  translateAnswerValue,
} from "@/modules/interviews/domain/interviewOptionLabels";

/**
 * Interview answers -> Brand Knowledge mapping (13_PRD_AsterBrain.md
 * "Reasoning Pipeline" steps 2-5). Deterministic; `confidenceNotes` and
 * `reasoningSummary` are filled in by the caller once confidence has been
 * calculated and the reasoning text composed.
 */
export function buildBrandKnowledge(
  answers: Record<string, string>,
  locale: Locale = "ko",
): Omit<BrandKnowledge, "confidenceNotes" | "reasoningSummary"> {
  return buildBrandKnowledgeFields(answers, locale);
}

interface ArchetypeTemplate {
  archetypeKey: "sage" | "everyman" | "ruler";
  toneKey: "professional" | "warm" | "premium";
}

/**
 * 3 fixed, deliberately distinct archetype directions used both as the
 * candidate-generation fallback (Mock provider / parse failure) and as the
 * structural skeleton an AI-generated response is expected to vary. Picking
 * 1 of 3 is the new Brand Strategy step's core interaction (mirrors Style
 * selection's recommend-then-select pattern).
 */
const ARCHETYPE_TEMPLATES: ArchetypeTemplate[] = [
  { archetypeKey: "sage", toneKey: "professional" },
  { archetypeKey: "everyman", toneKey: "warm" },
  { archetypeKey: "ruler", toneKey: "premium" },
];

export function buildStrategyProfile(
  answers: Record<string, string>,
  knowledge: BrandKnowledgeFields,
  template: ArchetypeTemplate,
  locale: Locale = "ko",
): BrandStrategyProfile {
  const m = MESSAGES[locale].asterBrain;
  const archetype = m[`archetype_${template.archetypeKey}`];
  const toneAndManner = m[`tone_${template.toneKey}`];
  const positioning = m[`positioningTemplate_${template.archetypeKey}`]
    .replace("{industry}", translateAnswerValue(answers.industry, INDUSTRY_LABEL_KEYS, locale) || m.fallbackIndustryGeneric)
    .replace("{audience}", knowledge.audience || m.fallbackTargetAudience);

  return {
    positioning,
    coreMessage: knowledge.tagline,
    toneAndManner,
    personality: toneAndManner,
    brandArchetype: archetype,
    visualDirection: knowledge.visualDirection,
    recommendedStyles: [
      { value: m.defaultStyle, reason: m.styleReasonTemplate.replace("{archetype}", archetype) },
    ],
    recommendedColors: [
      { value: knowledge.preferredColor, reason: m.colorReasonTemplate.replace("{archetype}", archetype) },
    ],
    recommendedTypography: [
      {
        value: knowledge.typographyDirection,
        reason: m.typographyReasonTemplate.replace("{audience}", knowledge.audience || m.fallbackTargetAudience),
      },
    ],
    recommendedSymbols: [
      { value: m.defaultSymbol, reason: m.symbolReasonTemplate.replace("{tone}", toneAndManner) },
    ],
  };
}

export function buildFallbackStrategyProfiles(
  answers: Record<string, string>,
  knowledge: BrandKnowledgeFields,
  locale: Locale = "ko",
): BrandStrategyProfile[] {
  return ARCHETYPE_TEMPLATES.map((template) => buildStrategyProfile(answers, knowledge, template, locale));
}

export function buildFallbackReasoningSummary(
  answers: Record<string, string>,
  profile: BrandStrategyProfile,
  locale: Locale = "ko",
): string {
  const m = MESSAGES[locale].asterBrain;
  return m.fallbackReasoningTemplate
    .replace("{brand}", answers.brandName || m.fallbackBrandThis)
    .replace("{industry}", translateAnswerValue(answers.industry, INDUSTRY_LABEL_KEYS, locale) || m.fallbackIndustryThis)
    .replace("{archetype}", profile.brandArchetype)
    .replace("{tone}", profile.toneAndManner || m.fallbackUniqueTone)
    .replace("{audience}", translateAnswerValue(answers.targetAudience, TARGET_AUDIENCE_LABEL_KEYS, locale) || m.fallbackTargetAudience)
    .replace("{positioning}", profile.positioning || m.fallbackPositioning);
}

/**
 * "브랜드 전략"/"로고 스타일" 단계가 없는(브랜딩 & 로고가 아닌) 작업물
 * 유형을 위한 즉석 대체 데이터 -- Aster Brain의 Mock 프로바이더/AI 실패
 * 폴백과 완전히 동일한 결정론적 함수만 조합해서 쓴다(새 AI 호출도, 새
 * 비즈니스 로직도 추가하지 않는다). BuildPromptUseCase/BuildConceptBoardUseCase가
 * Brand Strategy 자체가 존재하지 않는 프로젝트에서 이 함수로 대체한다.
 */
export function buildFallbackBrandStrategyData(
  answers: Record<string, string>,
  locale: Locale = "ko",
): BrandStrategyData {
  const knowledgeFields = buildBrandKnowledge(answers, locale);
  const [profile] = buildFallbackStrategyProfiles(answers, knowledgeFields, locale);
  const reasoningSummary = buildFallbackReasoningSummary(answers, profile!, locale);
  const { score } = calculateConfidence(answers, locale);

  return {
    brandKnowledge: { ...knowledgeFields, confidenceNotes: "", reasoningSummary },
    brandStrategy: profile!,
    confidenceScore: score,
  };
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  notes: string;
}

// desiredImpression은 인터뷰의 필수 질문(항상 답변됨)이라 여기 포함한다 --
// 안 그러면 "항상 답변되는 필수 질문"이 매번 optional 가산점(+0.1)으로
// 잘못 집계돼 모든 프로젝트의 기본 confidence가 부풀려진다.
const REQUIRED_ANSWER_KEYS = new Set([
  "brandName",
  "industry",
  "purpose",
  "targetAudience",
  "desiredImpression",
]);

/**
 * Rule-based confidence score. A completed interview (5 required answers)
 * always yields a 0.5 base; each additional answered question (industry-
 * specific follow-ups, AI follow-up questions) adds richness signal.
 */
export function calculateConfidence(answers: Record<string, string>, locale: Locale = "ko"): ConfidenceResult {
  const optionalAnswered = Object.entries(answers).filter(
    ([key, value]) => !REQUIRED_ANSWER_KEYS.has(key) && value?.trim(),
  ).length;

  const score = Math.min(0.5 + optionalAnswered * 0.1, 1);
  const level: ConfidenceLevel = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  const m = MESSAGES[locale].asterBrain;
  const notes = optionalAnswered === 0 ? m.confidenceNotesLow : m.confidenceNotesHigh;

  return { score, level, notes };
}
