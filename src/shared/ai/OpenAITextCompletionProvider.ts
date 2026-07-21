import type {
  TextCompletionProvider,
  TextCompletionRequest,
  TextCompletionResult,
} from "@/shared/ai/TextCompletionProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAITextCompletionProvider implements TextCompletionProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    // gpt-4o-mini는 이미지도 받을 수 있다(vision) -- 이미지가 있을 때만 user
    // 메시지를 콘텐츠 블록 배열로 바꾸고, 없으면 기존처럼 순수 문자열 그대로
    // 보낸다(하위 호환, 대부분의 호출은 이미지가 없다).
    const userContent =
      request.imageDataUris && request.imageDataUris.length > 0
        ? [
            { type: "text", text: request.userPrompt },
            ...request.imageDataUris.map((url) => ({ type: "image_url", image_url: { url } })),
          ]
        : request.userPrompt;

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
          { role: "user", content: userContent },
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
    return isHealthEndpointReachable(`${OPENAI_MODELS_URL}/${this.model}`, {
      Authorization: `Bearer ${this.apiKey}`,
    });
  }
}
