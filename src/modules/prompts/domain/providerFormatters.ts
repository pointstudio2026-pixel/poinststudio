import type { GenerationPayload, PromptProvider } from "@/modules/prompts/domain/Prompt";
import { ProviderError } from "@/shared/errors/AppError";

export const DEFAULT_PROVIDER: PromptProvider = "openai";
export const SUPPORTED_PROVIDERS: PromptProvider[] = ["openai", "gemini", "nanobanana"];

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
): GenerationPayload {
  switch (provider) {
    case "openai":
      return {
        provider,
        model: "gpt-image-1",
        systemPrompt,
        userPrompt,
        parameters: { size: "1024x1024", quality: "high" },
      };
    case "gemini":
      return {
        provider,
        model: "gemini-2.5-flash-image",
        systemPrompt,
        userPrompt,
        parameters: { aspectRatio: "1:1" },
      };
    case "nanobanana":
      return {
        provider,
        model: "nano-banana-v1",
        systemPrompt,
        userPrompt,
        parameters: { resolution: "1024" },
      };
    default: {
      const _exhaustive: never = provider;
      throw new ProviderError(`지원하지 않는 Provider입니다: ${String(_exhaustive)}`);
    }
  }
}
