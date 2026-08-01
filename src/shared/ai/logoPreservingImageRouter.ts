import type { LogoPreservingImageProvider } from "@/shared/ai/LogoPreservingImageProvider";
import { MockLogoPreservingImageProvider } from "@/shared/ai/MockLogoPreservingImageProvider";
import { OpenAILogoPreservingImageProvider } from "@/shared/ai/OpenAILogoPreservingImageProvider";

/** mockupRenderRouter/imageGenerationRouter와 동일한 라우터 패턴. */
export function resolveLogoPreservingImageProvider(): LogoPreservingImageProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return new OpenAILogoPreservingImageProvider(openAiKey);
  }
  return new MockLogoPreservingImageProvider();
}
