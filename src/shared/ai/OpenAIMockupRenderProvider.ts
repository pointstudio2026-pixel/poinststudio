import type {
  MockupRenderProvider,
  MockupRenderRequest,
  MockupRenderResult,
} from "@/shared/ai/MockupRenderProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_MODEL = "dall-e-3";
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
    const prompt =
      `${request.templateName} 목업에 브랜드 로고를 적용한 사실적인 제품 사진. ` +
      `배경과 소품은 실제 사용 환경처럼 유지하고, 로고는 자연스럽게 배치한다. ` +
      `(참고 로고: ${request.logoImageUrl})`;

    const start = Date.now();
    const res = await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, prompt, n: 1, size: "1024x1024", response_format: "url" }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI mockup render failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`OpenAI 목업 렌더링 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string }[] };
    const url = json.data?.[0]?.url;
    if (!url) {
      throw new ProviderError("OpenAI 응답에서 이미지 URL을 찾을 수 없습니다.");
    }

    return { imageUrl: url, thumbnailUrl: url, provider: this.name, costAmount: ESTIMATED_COST_PER_IMAGE_USD };
  }

  async health(): Promise<boolean> {
    try {
      await this.render({
        logoImageUrl: "https://example.com/logo.png",
        backgroundUrl: "https://example.com/bg.png",
        placementArea: { xPct: 0, yPct: 0, widthPct: 100, heightPct: 100 },
        templateName: "health check",
      });
      return true;
    } catch {
      return false;
    }
  }
}
