import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import { OpenAITextCompletionProvider } from "@/shared/ai/OpenAITextCompletionProvider";
import { MockVisionEvaluationProvider } from "@/shared/ai/MockVisionEvaluationProvider";

/**
 * Vision 판단(생성된 이미지 자체를 보고 평가)은 이미지 입력을 지원하는
 * Provider가 필요하다 -- 지금은 OpenAI만 지원(imageDataUris, TextCompletionProvider.ts
 * 참고). 사용자가 명시적으로 "일단 클로드나 제미나이 제외하고 gpt만"으로
 * 결정했다(2026-07-24) -- 일반 textCompletionRouter.ts와 달리 Gemini/Claude로
 * 폴백하지 않는다. 키가 없으면 Mock으로 폴백해 개발 중 실비용 호출을 막는다.
 */
export function resolveVisionEvaluationProvider(): TextCompletionProvider {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) return new OpenAITextCompletionProvider(openAiKey);
  return new MockVisionEvaluationProvider();
}
