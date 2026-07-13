import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import { MockMockupRenderProvider } from "@/shared/ai/MockMockupRenderProvider";
import { OpenAIMockupRenderProvider } from "@/shared/ai/OpenAIMockupRenderProvider";

/** Same router pattern as imageGenerationRouter -- falls back to Mock when no API key is configured. */
export function resolveMockupRenderProvider(): MockupRenderProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return new OpenAIMockupRenderProvider(openAiKey);
  }
  return new MockMockupRenderProvider();
}
