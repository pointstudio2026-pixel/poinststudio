import type {
  GeneratedImageResult,
  ImageEditRequest,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  SizePreset,
} from "@/shared/ai/ImageGenerationProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
// dall-e-3 has been retired on newer OpenAI projects ("The model 'dall-e-3'
// does not exist") -- gpt-image-1 doesn't accept `response_format` at all
// (always returns base64).
//
// gpt-image-1 → gpt-image-2 (2026-07-21): gpt-image-1/1.5 have a well-
// documented, near-guaranteed failure mode on Korean/CJK text -- Hangul
// syllable blocks come back with jamo(자모) split apart or replaced with
// nonsense glyphs ("한글이지만 한글이 아님" user report). This is a model-
// level limitation (whole-word text encoding + training data skewed toward
// English/Latin captions), not something prompt wording can reliably fix.
// OpenAI's gpt-image-2 (released 2026-04-21) was trained specifically to
// address this -- reported ~99% CJK character accuracy vs. near-0% on the
// old model. Real cost per image goes up accordingly (see below).
const DEFAULT_MODEL = "gpt-image-2";
// Approximate per-image cost for the standard 1024x1024 tier at "medium"
// quality; OpenAI's images endpoint doesn't return an exact cost in the
// response the way the chat completions endpoint returns token usage, so
// this is an estimate for UsageLog.costAmount, not a billed amount.
// gpt-image-2 pricing by tier at 1024x1024: low ≈$0.006, medium ≈$0.053,
// high ≈$0.21. "high" would push real cost 5x over this app's original
// ≈$0.04 baseline (the whole Free/Pro/Studio quota model was priced
// against that baseline) -- OpenAI's own prompting guide explicitly still
// recommends medium (not just high) for small/dense text, and the CJK
// fix itself comes from the gpt-image-1→2 model switch, not the quality
// tier, so medium keeps ~99% of the Korean-text benefit at ~1.3x the
// original cost instead of ~5x. Revisit to "high" only for a plan tier
// where the margin can absorb it.
const ESTIMATED_COST_PER_IMAGE_USD = 0.053;

const OPENAI_SIZE_BY_PRESET: Record<SizePreset, "1024x1024" | "1024x1536" | "1536x1024"> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

export class OpenAIImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // gpt-image-1 only supports n=1 per request, so batch sequentially.
    // /v1/images/generations has no separate system/user role split (unlike
    // chat completions), so systemPrompt has to be folded into the single
    // prompt string -- same fix as GeminiImageGenerationProvider already
    // does. Without this, systemPrompt was silently dropped entirely,
    // including TEXT_ACCURACY_DIRECTIVE (the one instruction telling the
    // model to render brand names/text exactly as given, not paraphrase
    // them) -- a real bug, not just a missed optimization.
    const images: GeneratedImageResult[] = [];
    for (let i = 0; i < request.count; i++) {
      const url = await this.generateOne(`${request.systemPrompt}\n\n${request.userPrompt}`, request.sizePreset);
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
    // sourceImageUrl을 텍스트로 이어붙여도 이 텍스트→이미지 엔드포인트는
    // 실제로 참조하지 못한다 -- gpt-image-1로 바뀐 뒤로는 URL 대신
    // base64 데이터 URI(수십만~수백만자)가 돌아오므로 그대로 이어붙이면
    // OpenAI의 32,000자 프롬프트 길이 제한을 넘겨 매번 400으로 실패한다.
    const prompt = `${request.editInstruction}\n\n(기존 컨셉의 변형입니다.)`;
    const url = await this.generateOne(`${request.systemPrompt}\n\n${prompt}`);
    return {
      images: [{ url, thumbnailUrl: url }],
      provider: this.name,
      model: this.model,
      costAmount: ESTIMATED_COST_PER_IMAGE_USD,
    };
  }

  private async generateOne(prompt: string, sizePreset: SizePreset = "square"): Promise<string> {
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
        size: OPENAI_SIZE_BY_PRESET[sizePreset],
        // Was silently never sent before (a "quality" value existed in
        // providerFormatters.ts's persisted payload but nothing ever read
        // it) -- gpt-image family accepts low/medium/high/auto. "medium"
        // is OpenAI's own documented recommendation for small/dense text
        // (not just "high"), and is ~4x cheaper than high while "low" is
        // documented as producing outright "faulty" text -- see cost
        // comment above for why medium, not high, is the right default.
        quality: "medium",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI image generation failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
        body,
      });
      throw new ProviderError(`OpenAI 이미지 생성 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const entry = json.data?.[0];
    if (entry?.url) {
      return entry.url;
    }
    if (entry?.b64_json) {
      return `data:image/png;base64,${entry.b64_json}`;
    }
    throw new ProviderError("OpenAI 응답에서 이미지 데이터를 찾을 수 없습니다.");
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(`${OPENAI_MODELS_URL}/${this.model}`, {
      Authorization: `Bearer ${this.apiKey}`,
    });
  }
}
