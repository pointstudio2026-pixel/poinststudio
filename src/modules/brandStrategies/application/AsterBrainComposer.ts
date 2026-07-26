import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import type { BrandStrategyData, BrandStrategyProfile, ConfidenceLevel } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { BrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import {
  buildBrandKnowledge,
  buildFallbackReasoningSummary,
  buildFallbackStrategyProfiles,
  calculateConfidence,
} from "@/modules/brandStrategies/domain/asterBrainRules";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";
import { logger } from "@/shared/logging/logger";
import type { Locale } from "@/shared/i18n/locale";

const BASE_CANDIDATES_SYSTEM_PROMPT =
  "당신은 브랜드 전략가입니다. 주어진 브랜드 정보를 바탕으로 서로 뚜렷하게 다른 " +
  "브랜드 전략 방향 3가지를 제안하세요. 각 방향은 archetype(브랜드 원형, 한국어 " +
  '괄호 영문 병기), toneAndManner, positioning(한 문장), reasoningSummary(왜 이 ' +
  "방향이 이 브랜드에 적합한지 2~3문장) 4개 필드를 가진 JSON 객체이며, 정확히 3개를 " +
  '담은 JSON 배열만 출력하세요. 예: [{"archetype":"...","toneAndManner":"...",' +
  '"positioning":"...","reasoningSummary":"..."}, ...] 다른 설명이나 마크다운 ' +
  "코드블록 없이 순수 JSON 배열만 반환하고, 특정 실존 브랜드를 모방하지 마세요.";

// 화면(AsterBrainView)이 사용자가 고른 언어로 t()를 통해 라벨을 번역해도,
// 실제 텍스트 값(archetype/toneAndManner/positioning/reasoningSummary)은
// AI가 그때그때 생성하는 콘텐츠라 정적 i18n 표로 다룰 수 없다 -- 프롬프트에
// 목표 언어를 명시적으로 지시해 AI가 값 자체를 그 언어로 쓰게 한다.
// archetype 필드는 브랜드 원형 개념이 영어 관용구(The Sage 등)로 통용되므로
// ko를 제외한 모든 언어에서 한국어 병기 없이 원형명만 쓰도록 안내한다.
const LANGUAGE_INSTRUCTION_BY_LOCALE: Record<Locale, string> = {
  ko: "",
  en: " All text field values (archetype, toneAndManner, positioning, reasoningSummary) must be written in English, without any Korean.",
  ja: " archetype、toneAndManner、positioning、reasoningSummaryの各テキスト値はすべて日本語で書いてください(韓国語を含めないこと)。",
  fr: " Toutes les valeurs textuelles (archetype, toneAndManner, positioning, reasoningSummary) doivent être rédigées en français, sans aucun coréen.",
  de: " Alle Textwerte (archetype, toneAndManner, positioning, reasoningSummary) müssen auf Deutsch verfasst sein, ohne Koreanisch.",
};

function buildCandidatesSystemPrompt(locale: Locale): string {
  return `${BASE_CANDIDATES_SYSTEM_PROMPT}${LANGUAGE_INSTRUCTION_BY_LOCALE[locale]}`;
}

interface AiCandidate {
  archetype: string;
  toneAndManner: string;
  positioning: string;
  reasoningSummary: string;
}

export interface AsterBrainComposeResult {
  candidates: BrandStrategyData[];
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Aster Brain's reasoning step (13_PRD_AsterBrain.md pipeline steps 4-7):
 * Brand Knowledge and per-candidate confidence are fully rule-based and
 * deterministic, derived directly from interview answers. The 3 strategy
 * directions (archetype/tone/positioning/reasoning) go through the AI
 * provider in a single call requesting structured JSON, with a deterministic
 * 3-template fallback used for the Mock provider or if the call/parse fails
 * -- mirrors the image pipeline's "1 call, N candidates" pattern.
 */
export class AsterBrainComposer {
  /**
   * `providerPreference` is the user's per-request choice from the UI
   * ("openai"|"gemini"|"claude") -- resolved fresh via the Router on every
   * call rather than fixed at construction, since Aster Brain execution is
   * synchronous (unlike image generation, no need to persist the choice).
   */
  async compose(
    answers: Record<string, string>,
    locale: Locale = "ko",
    providerPreference?: string,
  ): Promise<AsterBrainComposeResult> {
    const textCompletionProvider = resolveTextCompletionProvider(providerPreference);
    const knowledgeBase = buildBrandKnowledge(answers);
    const confidence = calculateConfidence(answers);

    const profiles = await this.buildStrategyProfiles(answers, knowledgeBase, textCompletionProvider, locale);

    const candidates: BrandStrategyData[] = profiles.map((profile) => ({
      brandKnowledge: { ...knowledgeBase, confidenceNotes: confidence.notes, reasoningSummary: profile.reasoningSummary },
      brandStrategy: profile.strategy,
      confidenceScore: confidence.score,
    }));

    return {
      candidates,
      reasoningSummary: candidates[0]!.brandKnowledge.reasoningSummary,
      confidenceLevel: confidence.level,
    };
  }

  private async buildStrategyProfiles(
    answers: Record<string, string>,
    knowledge: BrandKnowledgeFields,
    textCompletionProvider: TextCompletionProvider,
    locale: Locale,
  ): Promise<{ strategy: BrandStrategyProfile; reasoningSummary: string }[]> {
    const fallbackProfiles = buildFallbackStrategyProfiles(answers, knowledge);
    const fallback = fallbackProfiles.map((strategy) => ({
      strategy,
      reasoningSummary: buildFallbackReasoningSummary(answers, strategy),
    }));

    if (textCompletionProvider.name === "mock") {
      return fallback;
    }

    try {
      const result = await textCompletionProvider.complete({
        systemPrompt: buildCandidatesSystemPrompt(locale),
        userPrompt: JSON.stringify({ answers, knowledge }),
        maxTokens: 900,
      });

      const parsed = parseAiCandidates(result.text);
      if (!parsed || parsed.length !== 3) {
        return fallback;
      }

      return parsed.map((candidate, index) => ({
        strategy: {
          ...fallbackProfiles[index]!,
          brandArchetype: candidate.archetype,
          toneAndManner: candidate.toneAndManner,
          personality: candidate.toneAndManner,
          positioning: candidate.positioning,
        },
        reasoningSummary: candidate.reasoningSummary,
      }));
    } catch (err) {
      logger.error("Aster Brain candidate generation failed, using fallback", {
        provider: textCompletionProvider.name,
        details: err instanceof Error ? err.message : String(err),
      });
      return fallback;
    }
  }
}

function parseAiCandidates(text: string): AiCandidate[] | null {
  try {
    const cleaned = text.trim().replace(/^```json\s*|```$/g, "");
    const data = JSON.parse(cleaned);
    if (!Array.isArray(data)) return null;
    if (!data.every((c) => typeof c?.archetype === "string" && typeof c?.toneAndManner === "string" && typeof c?.positioning === "string" && typeof c?.reasoningSummary === "string")) {
      return null;
    }
    return data as AiCandidate[];
  } catch {
    return null;
  }
}
