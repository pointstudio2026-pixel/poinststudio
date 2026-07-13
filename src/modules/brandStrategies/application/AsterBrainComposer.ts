import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandStrategyData, ConfidenceLevel } from "@/modules/brandStrategies/domain/BrandStrategy";
import {
  buildBrandKnowledge,
  buildFallbackReasoningSummary,
  buildStrategyProfile,
  buildStyleCandidates,
  calculateConfidence,
} from "@/modules/brandStrategies/domain/asterBrainRules";
import { logger } from "@/shared/logging/logger";

const SUMMARY_SYSTEM_PROMPT =
  "당신은 브랜드 전략가입니다. 주어진 Brand Brief와 Brand Strategy 초안을 바탕으로 " +
  "왜 이 방향이 이 브랜드에 적합한지 설명하는 한국어 요약 문단(2~3문장)만 출력하세요. " +
  "다른 설명이나 JSON 없이 순수 텍스트만 반환하고, 특정 실존 브랜드를 모방하지 마세요.";

export interface AsterBrainComposeResult {
  data: BrandStrategyData;
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Aster Brain's reasoning step (13_PRD_AsterBrain.md pipeline steps 4-7):
 * structural mapping (Brand Knowledge, Strategy profile, style candidates,
 * confidence) is fully rule-based and deterministic; only the free-text
 * reasoning summary goes through the AI provider, with a deterministic
 * fallback template used for the Mock provider or if the call/parse fails.
 */
export class AsterBrainComposer {
  constructor(private readonly textCompletionProvider: TextCompletionProvider) {}

  async compose(
    brief: BrandBriefData,
    briefSource: "ai" | "user",
    answers: Record<string, string>,
  ): Promise<AsterBrainComposeResult> {
    const knowledgeBase = buildBrandKnowledge(brief);
    const strategyProfile = buildStrategyProfile(brief, knowledgeBase.visualDirection);
    const styleCandidates = buildStyleCandidates(brief);
    const confidence = calculateConfidence({
      competitiveContext: answers.competitiveContext,
      avoidKeywords: answers.avoidKeywords,
      briefSource,
      secondaryAudience: brief.secondaryAudience,
    });

    const reasoningSummary = await this.buildReasoningSummary(brief, strategyProfile);

    return {
      data: {
        brandKnowledge: { ...knowledgeBase, confidenceNotes: confidence.notes, reasoningSummary },
        brandStrategy: strategyProfile,
        styleCandidates,
        confidenceScore: confidence.score,
      },
      reasoningSummary,
      confidenceLevel: confidence.level,
    };
  }

  private async buildReasoningSummary(
    brief: BrandBriefData,
    profile: ReturnType<typeof buildStrategyProfile>,
  ): Promise<string> {
    const fallback = buildFallbackReasoningSummary(brief, profile);
    if (this.textCompletionProvider.name === "mock") {
      return fallback;
    }

    try {
      const result = await this.textCompletionProvider.complete({
        systemPrompt: SUMMARY_SYSTEM_PROMPT,
        userPrompt: JSON.stringify({ brief, profile }),
        maxTokens: 300,
      });
      return result.text.trim() || fallback;
    } catch (err) {
      logger.error("Aster Brain reasoning summary failed, using fallback", {
        provider: this.textCompletionProvider.name,
        details: err instanceof Error ? err.message : String(err),
      });
      return fallback;
    }
  }
}
