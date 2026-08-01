import type { MockupCategory } from "@/modules/mockups/domain/Mockup";
import { buildMockupBackgroundPrompt, type PlaceholderShape } from "@/shared/ai/mockupBackgroundGenerationRules";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { resolveImageBuffer } from "@/shared/ai/mockupAssets";
import { ProviderError, ValidationError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

export interface GenerateMockupBackgroundImageInput {
  category: MockupCategory;
  /** 관리자가 채팅창에 직접 쓴 자유 텍스트. */
  description: string;
  shape: PlaceholderShape;
  containsKoreanText: boolean;
  isGeneric: boolean;
  referenceImage?: { buffer: Buffer; contentType: string } | null;
}

export interface GenerateMockupBackgroundImageOutput {
  imageDataUri: string;
  prompt: string;
  provider: string;
  costAmount: number;
}

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";

/**
 * 관리자 채팅형 목업 배경 생성 -- 표준 규칙(자리표시자 마크, 상호명 금지,
 * 단순함 등)은 buildMockupBackgroundPrompt가 자동으로 덧붙이므로, 관리자는
 * 무드/스타일 설명만 자유롭게 쓰면 된다. 참고 이미지가 첨부되면 실제 픽셀
 * 참조가 가능한 OpenAI /v1/images/edits 경로(OpenAIMockupRenderProvider와
 * 동일한 방식)로, 없으면 기존 멀티 프로바이더 텍스트→이미지 경로
 * (resolveImageGenerationProvider)로 생성한다 -- 범용 ImageGenerationProvider
 * .edit()은 실제로 참고 이미지 픽셀을 반영하지 않는다(텍스트 프롬프트로만
 * 재생성, 확인된 기존 한계)는 이 때문에 여기서는 쓰지 않는다.
 */
export class GenerateMockupBackgroundImageUseCase {
  async execute(input: GenerateMockupBackgroundImageInput): Promise<GenerateMockupBackgroundImageOutput> {
    const prompt = buildMockupBackgroundPrompt({
      category: input.category,
      description: input.description,
      shape: input.shape,
      hasReferenceImage: !!input.referenceImage,
      containsKoreanText: input.containsKoreanText,
      isGeneric: input.isGeneric,
    });

    if (input.referenceImage) {
      return this.generateWithReference(prompt, input.referenceImage);
    }

    const provider = resolveImageGenerationProvider();
    const result = await provider.generate({ systemPrompt: "", userPrompt: prompt, count: 1, sizePreset: "square" });
    const image = result.images[0];
    if (!image) throw new ProviderError("이미지 생성에 실패했습니다.");
    const { buffer, mimeType } = await resolveImageBuffer(image.url);
    return {
      imageDataUri: `data:${mimeType};base64,${buffer.toString("base64")}`,
      prompt,
      provider: result.provider,
      costAmount: result.costAmount,
    };
  }

  private async generateWithReference(
    prompt: string,
    referenceImage: { buffer: Buffer; contentType: string },
  ): Promise<GenerateMockupBackgroundImageOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ValidationError("참고 이미지를 첨부한 생성은 OpenAI API 키가 설정된 경우에만 가능합니다.");
    }

    const form = new FormData();
    form.append("model", "gpt-image-2");
    form.append("prompt", prompt);
    form.append("quality", "medium");
    form.append("size", "1024x1024");
    form.append(
      "image[]",
      new Blob([new Uint8Array(referenceImage.buffer)], { type: referenceImage.contentType }),
      "reference.png",
    );

    const start = Date.now();
    const res = await fetch(OPENAI_EDITS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Admin mockup background generation (with reference) failed", {
        status: res.status,
        duration: Date.now() - start,
        body,
      });
      throw new ProviderError(`OpenAI 이미지 생성 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const entry = json.data?.[0];
    const url = entry?.url ?? (entry?.b64_json ? `data:image/png;base64,${entry.b64_json}` : undefined);
    if (!url) throw new ProviderError("OpenAI 응답에서 이미지 데이터를 찾을 수 없습니다.");

    const { buffer, mimeType } = await resolveImageBuffer(url);
    return {
      imageDataUri: `data:${mimeType};base64,${buffer.toString("base64")}`,
      prompt,
      provider: "openai",
      costAmount: 0.053,
    };
  }
}
