import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";
import { OpenAIImageGenerationProvider } from "@/shared/ai/OpenAIImageGenerationProvider";

/**
 * 25_AIProviderArchitecture.md Provider Router for image generation. Falls
 * back to the Mock provider when no API key is configured, so the whole
 * generation pipeline (Queue, Worker, versioning, usage tracking) keeps
 * working before a real image-gen key is wired in. Reuses OPENAI_API_KEY
 * (the same key already used for text completion) rather than introducing
 * a second env var for now.
 */
export function resolveImageGenerationProvider(): ImageGenerationProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return new OpenAIImageGenerationProvider(openAiKey);
  }
  return new MockImageGenerationProvider();
}
