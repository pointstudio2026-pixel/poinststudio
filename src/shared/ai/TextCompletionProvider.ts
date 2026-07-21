export interface TextCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * 이미지를 함께 보내는 비전(vision) 요청용 -- data URI(`data:image/png;base64,...`) 배열.
   * User Styles 참고 이미지 분석 등 소수 Provider만 실제로 지원한다(현재 OpenAI만).
   * 지원하지 않는 Provider는 이 필드를 무시하고 텍스트만으로 completion한다.
   */
  imageDataUris?: string[];
}

export interface TextCompletionResult {
  text: string;
  provider: string;
  model: string;
}

/**
 * 25_AIProviderArchitecture.md's Adapter Contract, specialized for text
 * completion (used by Task-008's follow-up questions and later Task-010's
 * Aster Brain). Business logic must never call a provider SDK directly —
 * only through this interface.
 */
export interface TextCompletionProvider {
  readonly name: string;
  complete(request: TextCompletionRequest): Promise<TextCompletionResult>;
  health(): Promise<boolean>;
}
