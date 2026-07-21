import type {
  TextCompletionProvider,
  TextCompletionRequest,
  TextCompletionResult,
} from "@/shared/ai/TextCompletionProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

// gemini-2.5-flash is no longer available to new free-tier API keys as of
// 2026-07 (returns 404 "no longer available to new users"); 2.0-flash has
// broader access.
const DEFAULT_MODEL = "gemini-2.0-flash";

function endpointFor(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function modelInfoEndpointFor(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;
}

export class GeminiTextCompletionProvider implements TextCompletionProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    const start = Date.now();
    const res = await fetch(endpointFor(this.model, this.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 200,
          temperature: request.temperature ?? 0.7,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Gemini text completion failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`Gemini 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) {
      throw new ProviderError("Gemini 응답에서 텍스트를 찾을 수 없습니다.");
    }

    return { text, provider: this.name, model: this.model };
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(modelInfoEndpointFor(this.model, this.apiKey), {});
  }
}
