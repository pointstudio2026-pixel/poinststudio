import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { buildFallbackEnhancedFields, buildRuleBasedFields } from "@/modules/brandBriefs/domain/brandBriefRules";
import { logger } from "@/shared/logging/logger";

const SYSTEM_PROMPT =
  "당신은 브랜드 전략가입니다. 브랜드 인터뷰 답변을 바탕으로 아래 JSON 스키마에 맞는 " +
  "브랜드 방향성 초안을 작성하세요. 반드시 유효한 JSON 객체만 출력하고, 다른 설명은 " +
  "덧붙이지 마세요. 필드: tagline(string), vision(string), positioning(string), " +
  "secondaryAudience(string), brandTone(string), brandPersonality(string), " +
  "keywords(string[]), preferredStyle(string), preferredColor(string), " +
  "preferredSymbol(string), typographyDirection(string). 특정 실존 브랜드를 모방하지 마세요.";

/**
 * "AI 구조화" (Task-009): direct field mapping is rule-based; only the
 * fields that need real inference (tagline/vision/positioning/tone/
 * personality/keywords/visual direction) go through the AI provider. Falls
 * back to a deterministic template if the provider is the Mock, or if a
 * real provider's response isn't valid JSON.
 */
export class BrandBriefComposer {
  constructor(private readonly textCompletionProvider: TextCompletionProvider) {}

  async compose(answers: Record<string, string>): Promise<BrandBriefData> {
    const base = buildRuleBasedFields(answers);

    if (this.textCompletionProvider.name === "mock") {
      return { ...base, ...buildFallbackEnhancedFields(answers, base) };
    }

    try {
      const result = await this.textCompletionProvider.complete({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: JSON.stringify(answers),
        maxTokens: 600,
      });
      const parsed = JSON.parse(result.text) as Partial<Omit<BrandBriefData, keyof typeof base>>;
      return { ...base, ...buildFallbackEnhancedFields(answers, base), ...parsed };
    } catch (err) {
      logger.error("Brand Brief AI enhancement failed, using fallback fields", {
        provider: this.textCompletionProvider.name,
        details: err instanceof Error ? err.message : String(err),
      });
      return { ...base, ...buildFallbackEnhancedFields(answers, base) };
    }
  }
}
