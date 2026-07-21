import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import { MockTextCompletionProvider } from "@/shared/ai/MockTextCompletionProvider";
import { OpenAITextCompletionProvider } from "@/shared/ai/OpenAITextCompletionProvider";
import { GeminiTextCompletionProvider } from "@/shared/ai/GeminiTextCompletionProvider";
import { ClaudeTextCompletionProvider } from "@/shared/ai/ClaudeTextCompletionProvider";

/**
 * 25_AIProviderArchitecture.md Provider Router: picks the best available
 * provider without any business logic depending on which one is active.
 * Falls back to the Mock provider when no API key is configured, so every
 * AI-dependent feature keeps working before real credentials are wired in.
 *
 * Priority when multiple keys are configured: an explicit `preferred` arg
 * (e.g. the user's per-request choice in the UI) wins first if its key is
 * present; else the TEXT_COMPLETION_PROVIDER env var forces a specific one
 * (if its key is also present); otherwise OpenAI → Gemini → Claude → Mock.
 */
export function resolveTextCompletionProvider(preferred?: string): TextCompletionProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const forced = preferred?.toLowerCase() || process.env.TEXT_COMPLETION_PROVIDER?.toLowerCase();

  if (forced === "openai" && openAiKey) return new OpenAITextCompletionProvider(openAiKey);
  if (forced === "gemini" && geminiKey) return new GeminiTextCompletionProvider(geminiKey);
  if (forced === "claude" && claudeKey) return new ClaudeTextCompletionProvider(claudeKey);

  if (openAiKey) return new OpenAITextCompletionProvider(openAiKey);
  if (geminiKey) return new GeminiTextCompletionProvider(geminiKey);
  if (claudeKey) return new ClaudeTextCompletionProvider(claudeKey);
  return new MockTextCompletionProvider();
}
