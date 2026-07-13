import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import { MockTextCompletionProvider } from "@/shared/ai/MockTextCompletionProvider";
import { OpenAITextCompletionProvider } from "@/shared/ai/OpenAITextCompletionProvider";

/**
 * 25_AIProviderArchitecture.md Provider Router: picks the best available
 * provider without any business logic depending on which one is active.
 * Falls back to the Mock provider when no API key is configured, so every
 * AI-dependent feature keeps working before real credentials are wired in.
 */
export function resolveTextCompletionProvider(): TextCompletionProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return new OpenAITextCompletionProvider(openAiKey);
  }
  return new MockTextCompletionProvider();
}
