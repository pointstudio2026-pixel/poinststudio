export interface TextCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
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
