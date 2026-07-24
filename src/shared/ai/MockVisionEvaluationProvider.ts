import type { TextCompletionProvider, TextCompletionRequest, TextCompletionResult } from "@/shared/ai/TextCompletionProvider";

/**
 * 실제 Vision 평가 API 키(OPENAI_API_KEY)가 없을 때 쓰는 결정론적 폴백 --
 * 항상 통과 수준의 JSON을 반환해 개발 중 실비용 호출 없이도 파이프라인
 * 전체가 동작하게 한다(visionEvaluationRouter.ts).
 */
export class MockVisionEvaluationProvider implements TextCompletionProvider {
  readonly name = "mock";

  async complete(_request: TextCompletionRequest): Promise<TextCompletionResult> {
    const json = JSON.stringify({
      hardConstraintsRespected: true,
      brandAlignment: { score: 0.7, reasoning: "Mock 평가 -- 실제 Vision 호출 없음(OPENAI_API_KEY 미설정)." },
      trendAlignment: { score: 0.7, reasoning: "Mock 평가 -- 실제 Vision 호출 없음(OPENAI_API_KEY 미설정)." },
      technicalQuality: { score: 0.7, reasoning: "Mock 평가 -- 실제 Vision 호출 없음(OPENAI_API_KEY 미설정)." },
      singleConceptRespected: true,
      summary: "Mock 평가(OPENAI_API_KEY 미설정) -- 실제 이미지 분석 없음.",
    });
    return { text: json, provider: this.name, model: "mock-vision-v1" };
  }

  async health(): Promise<boolean> {
    return true;
  }
}
