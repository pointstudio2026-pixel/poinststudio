import type {
  GeneratedImageResult,
  ImageEditRequest,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from "@/shared/ai/ImageGenerationProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_MODEL = "dall-e-3";
// Approximate per-image cost for the standard 1024x1024 tier; OpenAI's images
// endpoint doesn't return an exact cost in the response the way the chat
// completions endpoint returns token usage, so this is an estimate for
// UsageLog.costAmount, not a billed amount.
const ESTIMATED_COST_PER_IMAGE_USD = 0.04;

export class OpenAIImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // dall-e-3 only supports n=1 per request, so batch sequentially.
    const images: GeneratedImageResult[] = [];
    for (let i = 0; i < request.count; i++) {
      const url = await this.generateOne(request.userPrompt);
      images.push({ url, thumbnailUrl: url });
    }

    return {
      images,
      provider: this.name,
      model: this.model,
      costAmount: ESTIMATED_COST_PER_IMAGE_USD * request.count,
    };
  }

  /**
   * True image-to-image editing (OpenAI's /images/edits endpoint) needs an
   * uploaded source file + mask, which doesn't fit this pipeline -- Mock
   * images are inline data URIs, not stored binaries, and OpenAI-hosted
   * generation URLs expire. As a pragmatic simplification (documented,
   * revisit once real file storage exists), an edit becomes a fresh
   * generation call whose prompt describes the requested change relative
   * to the original concept, rather than true pixel-level editing.
   */
  async edit(request: ImageEditRequest): Promise<ImageGenerationResult> {
    const prompt = `${request.editInstruction}\n\n(기존 컨셉의 변형입니다: ${request.sourceImageUrl})`;
    const url = await this.generateOne(prompt);
    return {
      images: [{ url, thumbnailUrl: url }],
      provider: this.name,
      model: this.model,
      costAmount: ESTIMATED_COST_PER_IMAGE_USD,
    };
  }

  private async generateOne(prompt: string): Promise<string> {
    const start = Date.now();
    const res = await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI image generation failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`OpenAI 이미지 생성 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string }[] };
    const url = json.data?.[0]?.url;
    if (!url) {
      throw new ProviderError("OpenAI 응답에서 이미지 URL을 찾을 수 없습니다.");
    }
    return url;
  }

  async health(): Promise<boolean> {
    try {
      await this.generateOne("health check ping");
      return true;
    } catch {
      return false;
    }
  }
}
