import type {
  TextCompletionProvider,
  TextCompletionRequest,
  TextCompletionResult,
} from "@/shared/ai/TextCompletionProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAITextCompletionProvider implements TextCompletionProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    const start = Date.now();
    const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        max_tokens: request.maxTokens ?? 200,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI text completion failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`OpenAI 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new ProviderError("OpenAI 응답에서 텍스트를 찾을 수 없습니다.");
    }

    return { text, provider: this.name, model: this.model };
  }

  async health(): Promise<boolean> {
    try {
      await this.complete({
        systemPrompt: "ping",
        userPrompt: "ping",
        maxTokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
