import type {
  TextCompletionProvider,
  TextCompletionRequest,
  TextCompletionResult,
} from "@/shared/ai/TextCompletionProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";

export class ClaudeTextCompletionProvider implements TextCompletionProvider {
  readonly name = "claude";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    const start = Date.now();
    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        max_tokens: request.maxTokens ?? 200,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Claude text completion failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`Claude 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { content?: { type?: string; text?: string }[] };
    const text = json.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    if (!text) {
      throw new ProviderError("Claude 응답에서 텍스트를 찾을 수 없습니다.");
    }

    return { text, provider: this.name, model: this.model };
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(`${ANTHROPIC_MODELS_URL}/${this.model}`, {
      "x-api-key": this.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    });
  }
}
