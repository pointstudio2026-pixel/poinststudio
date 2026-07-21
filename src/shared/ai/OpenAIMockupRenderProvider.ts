import type {
  MockupRenderProvider,
  MockupRenderRequest,
  MockupRenderResult,
} from "@/shared/ai/MockupRenderProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
// dall-e-3 has been retired on newer OpenAI projects ("The model 'dall-e-3'
// does not exist") -- gpt-image-1 is the current model, and it doesn't
// accept `response_format` at all (always returns base64). Same fix as
// OpenAIImageGenerationProvider.ts; this sibling file was missed earlier.
const DEFAULT_MODEL = "gpt-image-1";
const ESTIMATED_COST_PER_IMAGE_USD = 0.04;

/**
 * Same documented simplification as OpenAIImageGenerationProvider.edit():
 * true logo-onto-photo compositing needs an uploaded base image, which
 * this pipeline doesn't store as a real file. Describes the desired
 * mockup in a text prompt and generates fresh rather than compositing
 * pixel-for-pixel -- revisit once real file storage exists.
 */
export class OpenAIMockupRenderProvider implements MockupRenderProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async render(request: MockupRenderRequest): Promise<MockupRenderResult> {
    // `/v1/images/generations`는 순수 텍스트→이미지 엔드포인트라 이미지
    // 입력 파라미터가 없다 -- logoImageUrl을 텍스트로 이어붙여도 OpenAI가
    // 실제로 참조하지 못하므로 원래도 장식적인 문구였다. gpt-image-1로
    // 바뀐 뒤로는 URL 대신 base64 데이터 URI(수십만~수백만자)가 돌아오므로
    // 그대로 이어붙이면 OpenAI의 32,000자 프롬프트 길이 제한을 넘겨 매번
    // 400으로 실패한다 -- 아예 프롬프트에서 제외한다.
    const prompt =
      `${request.templateName} 목업에 브랜드 로고를 적용한 사실적인 제품 사진. ` +
      `배경과 소품은 실제 사용 환경처럼 유지하고, 로고는 자연스럽게 배치한다.`;

    const start = Date.now();
    const res = await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, prompt, n: 1, size: "1024x1024" }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI mockup render failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
        body,
      });
      throw new ProviderError(`OpenAI 목업 렌더링 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const entry = json.data?.[0];
    const url = entry?.url ?? (entry?.b64_json ? `data:image/png;base64,${entry.b64_json}` : undefined);
    if (!url) {
      throw new ProviderError("OpenAI 응답에서 이미지 데이터를 찾을 수 없습니다.");
    }

    return { imageUrl: url, thumbnailUrl: url, provider: this.name, costAmount: ESTIMATED_COST_PER_IMAGE_USD };
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(`${OPENAI_MODELS_URL}/${this.model}`, {
      Authorization: `Bearer ${this.apiKey}`,
    });
  }
}
