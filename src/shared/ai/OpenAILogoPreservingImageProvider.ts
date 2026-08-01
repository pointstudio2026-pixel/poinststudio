import type { LogoPreservingImageProvider, LogoPreservingImageRequest } from "@/shared/ai/LogoPreservingImageProvider";
import type { ImageGenerationResult, SizePreset } from "@/shared/ai/ImageGenerationProvider";
import { resolveImageBuffer } from "@/shared/ai/mockupAssets";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";
const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_QUALITY = "medium";
// OpenAIImageGenerationProvider/OpenAIMockupRenderProvider와 동일한 추정치.
const ESTIMATED_COST_PER_IMAGE_USD = 0.053;

const SIZE_BY_PRESET: Record<SizePreset, string> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

// 2026-08-01 사용자 지적: "이미지 생성" 단계에서 로고를 첨부해도, 고정된
// 목업 배경 템플릿 중 하나에 무작위로 합성하는 이전 방식(구
// GenerateFromLogoAssetUseCase)은 잘못됐다 -- 로고가 없을 때와 마찬가지로
// 매번 브랜드 인터뷰/스타일에 맞는 새 장면을 AI가 생성해야 하고, 그 안에
// 로고만 실제 파일 그대로 보존되어야 한다. systemPrompt/userPrompt는
// BuildPromptUseCase가 이미 만들어둔, 로고 없는 경우와 완전히 동일한
// 프롬프트를 그대로 받는다 -- 여기서는 "이 로고는 다시 그리지 말고 그대로
// 유지하라"는 지시만 덧붙인다.
const LOGO_PRESERVATION_CLAUSE =
  `\n\n첨부된 이미지는 사용자가 실제로 사용 중인 로고입니다 -- 절대 다시 ` +
  `그리거나 새로 해석하거나 다른 로고로 대체하지 마세요. 로고의 텍스트, ` +
  `심볼, 색상, 비율을 정확히 그대로 유지한 채, 위에서 설명한 장면 안에 ` +
  `자연스러운 크기와 위치로 배치하세요. 장면의 나머지 요소(배경, 소품, ` +
  `구도, 문구)는 위 지시에 따라 새로 만들어내되, 로고 자체만은 절대 ` +
  `다시 그리거나 수정하지 마세요.`;

export class OpenAILogoPreservingImageProvider implements LogoPreservingImageProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generate(request: LogoPreservingImageRequest): Promise<ImageGenerationResult> {
    const logo = await resolveImageBuffer(request.logoImageUrl);
    const prompt = `${request.systemPrompt}\n\n${request.userPrompt}${LOGO_PRESERVATION_CLAUSE}`;
    const size = SIZE_BY_PRESET[request.sizePreset ?? "square"];

    const form = new FormData();
    form.append("model", this.model);
    form.append("prompt", prompt);
    form.append("quality", DEFAULT_QUALITY);
    form.append("size", size);
    form.append("image[]", new Blob([new Uint8Array(logo.buffer)], { type: logo.mimeType }), "logo.png");

    const start = Date.now();
    const res = await fetch(OPENAI_EDITS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI logo-preserving generation failed", {
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
    const url = entry?.url ?? (entry?.b64_json ? `data:image/png;base64,${entry.b64_json}` : undefined);
    if (!url) {
      throw new ProviderError("OpenAI 응답에서 이미지 데이터를 찾을 수 없습니다.");
    }

    return {
      images: [{ url, thumbnailUrl: url }],
      provider: this.name,
      model: this.model,
      costAmount: ESTIMATED_COST_PER_IMAGE_USD,
    };
  }
}
