import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";
import { OpenAIImageGenerationProvider } from "@/shared/ai/OpenAIImageGenerationProvider";
import { GeminiImageGenerationProvider } from "@/shared/ai/GeminiImageGenerationProvider";

/**
 * 25_AIProviderArchitecture.md Provider Router for image generation. Falls
 * back to the Mock provider when no API key is configured, so the whole
 * generation pipeline (Queue, Worker, versioning, usage tracking) keeps
 * working before a real image-gen key is wired in.
 *
 * Priority when multiple keys are configured: an explicit `preferred` arg
 * (e.g. the user's per-request choice, persisted on the GenerationVersion
 * since generation runs async in a Worker) wins first if its key is
 * present; else IMAGE_GENERATION_PROVIDER env var forces a specific one;
 * otherwise OpenAI → Gemini → Mock. Claude has no image generation API, so
 * it's intentionally not part of this router (see textCompletionRouter).
 */
export function resolveImageGenerationProvider(preferred?: string | null): ImageGenerationProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const forced = preferred?.toLowerCase() || process.env.IMAGE_GENERATION_PROVIDER?.toLowerCase();

  if (forced === "openai" && openAiKey) return new OpenAIImageGenerationProvider(openAiKey);
  if (forced === "gemini" && geminiKey) return new GeminiImageGenerationProvider(geminiKey);

  if (openAiKey) return new OpenAIImageGenerationProvider(openAiKey);
  if (geminiKey) return new GeminiImageGenerationProvider(geminiKey);
  return new MockImageGenerationProvider();
}
