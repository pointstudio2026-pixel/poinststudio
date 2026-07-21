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

// providerFormatters.ts의 "gemini" 포맷도 동일 모델을 참조한다.
//
// gemini-2.5-flash-image("나노 바나나" 오리지널) → gemini-3-pro-image
// ("나노 바나나 프로", 2026-07-21): 오리지널 나노 바나나는 한글 렌더링이
// 여전히 약하다는 게 여러 소스에서 확인됨(BPE 토크나이저가 한글 음절을
// 자모 단위로 쪼개 그림). gemini-3-pro-image는 한글 포함 다국어 텍스트
// 렌더링을 명시적으로 개선한 모델(공식 문서 기준 다국어 문자 정확도 약
// 94%). OpenAI(gpt-image-2)가 기본 provider라 이 파일은 사용자가 명시적으로
// "Gemini"를 고를 때만 영향을 준다.
const DEFAULT_MODEL = "gemini-3-pro-image";
// Gemini 이미지 응답은 OpenAI처럼 호스팅 URL이 아니라 base64 inline data로
// 오므로, 정확한 과금 응답이 따로 없어 UsageLog.costAmount용 추정치만 둔다.
// gemini-3-pro-image 1~2K 이미지 기준 공개된 추정가 약 $0.134/장.
const ESTIMATED_COST_PER_IMAGE_USD = 0.13;

// generationConfig.imageConfig.aspectRatio -- 실제 Gemini 키로 검증된 적 없는
// 경로다(과금/쿼터 이슈로 이 세션 내내 미검증, project_aster_multi_provider_ai
// 메모 참고). OpenAI와 동일하게 정사각형이 기본이던 걸 명시적 프리셋으로
// 바꾸는 최선의 시도이며, 실제 파라미터명/값이 다르면 API가 무시하거나
// 에러를 낼 수 있음 -- 실제 키로 처음 시도할 때 확인 필요.
const GEMINI_ASPECT_RATIO_BY_PRESET: Record<SizePreset, string> = {
  square: "1:1",
  portrait: "3:4",
  landscape: "4:3",
};

function endpointFor(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function modelInfoEndpointFor(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;
}

export class GeminiImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Gemini의 generateContent는 호출당 이미지 1개를 반환하므로 OpenAI
    // 어댑터와 동일하게 순차 호출로 배치한다.
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
   * OpenAI 어댑터와 동일한 실용적 단순화: 실제 픽셀 단위 편집이 아니라,
   * 요청된 변경 사항을 설명하는 새 생성 호출로 처리한다.
   */
  async edit(request: ImageEditRequest): Promise<ImageGenerationResult> {
    const prompt = `${request.editInstruction}\n\n(기존 컨셉의 변형입니다: ${request.sourceImageUrl})`;
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
    const res = await fetch(endpointFor(this.model, this.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { imageConfig: { aspectRatio: GEMINI_ASPECT_RATIO_BY_PRESET[sizePreset] } },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Gemini image generation failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
      });
      throw new ProviderError(`Gemini 이미지 생성 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
    };
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.map((p) => p.inlineData).find((d) => d?.data);
    if (!inline?.data) {
      throw new ProviderError("Gemini 응답에서 이미지 데이터를 찾을 수 없습니다.");
    }

    return `data:${inline.mimeType ?? "image/png"};base64,${inline.data}`;
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(modelInfoEndpointFor(this.model, this.apiKey), {});
  }
}
