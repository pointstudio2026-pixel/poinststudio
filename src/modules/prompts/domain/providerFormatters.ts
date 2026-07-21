import type { GenerationPayload, PromptProvider } from "@/modules/prompts/domain/Prompt";
import type { SizePreset } from "@/shared/ai/ImageGenerationProvider";
import { ProviderError } from "@/shared/errors/AppError";

export const DEFAULT_PROVIDER: PromptProvider = "openai";
export const SUPPORTED_PROVIDERS: PromptProvider[] = ["openai", "gemini", "nanobanana"];

const OPENAI_SIZE_BY_PRESET: Record<SizePreset, string> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

const GEMINI_ASPECT_RATIO_BY_PRESET: Record<SizePreset, string> = {
  square: "1:1",
  portrait: "3:4",
  landscape: "4:3",
};

/**
 * 14_PRD_PromptEngine.md "Model Adapter": Prompt Engine stays independent
 * of any single provider's payload shape -- swapping/adding a provider
 * only touches this formatter, never PromptBuilderUseCase. Actual
 * generation execution is Task-013's scope; this only prepares the
 * provider-shaped payload.
 */
export function formatForProvider(
  provider: PromptProvider,
  systemPrompt: string,
  userPrompt: string,
  sizePreset: SizePreset = "square",
): GenerationPayload {
  switch (provider) {
    case "openai":
      return {
        provider,
        // gpt-image-2, not gpt-image-1 -- see OpenAIImageGenerationProvider.ts
        // for why (Korean/CJK text rendering).
        model: "gpt-image-2",
        systemPrompt,
        userPrompt,
        sizePreset,
        parameters: { size: OPENAI_SIZE_BY_PRESET[sizePreset], quality: "medium" },
      };
    case "gemini":
      return {
        provider,
        // gemini-3-pro-image, not gemini-2.5-flash-image -- see
        // GeminiImageGenerationProvider.ts for why (Korean/CJK text
        // rendering).
        model: "gemini-3-pro-image",
        systemPrompt,
        userPrompt,
        sizePreset,
        parameters: { aspectRatio: GEMINI_ASPECT_RATIO_BY_PRESET[sizePreset] },
      };
    case "nanobanana":
      return {
        provider,
        model: "nano-banana-v1",
        systemPrompt,
        userPrompt,
        sizePreset,
        parameters: { resolution: "1024" },
      };
    default: {
      const _exhaustive: never = provider;
      throw new ProviderError(`지원하지 않는 Provider입니다: ${String(_exhaustive)}`);
    }
  }
}
