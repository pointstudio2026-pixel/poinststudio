import type {
  TextCompletionProvider,
  TextCompletionRequest,
  TextCompletionResult,
} from "@/shared/ai/TextCompletionProvider";

/**
 * Deterministic, template-based stand-in used whenever no real provider is
 * configured (no API key set). Lets every AI-dependent feature stay fully
 * functional and testable before a real key is wired in — see
 * TextCompletionRouter.
 */
export class MockTextCompletionProvider implements TextCompletionProvider {
  readonly name = "mock";

  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    return {
      text: this.buildFollowUpQuestion(request.userPrompt),
      provider: this.name,
      model: "template-v1",
    };
  }

  async health(): Promise<boolean> {
    return true;
  }

  private buildFollowUpQuestion(userPrompt: string): string {
    const questionMatch = /질문:\s*"([^"]+)"/.exec(userPrompt);
    const topic = questionMatch?.[1] ?? "이전 답변";
    return `"${topic}"에 대해 조금 더 구체적으로 설명해 주시겠어요? 예시나 구체적인 상황을 알려주시면 브랜드 방향을 더 정확히 잡을 수 있어요.`;
  }
}
