import type { LogoPreservingImageProvider, LogoPreservingImageRequest } from "@/shared/ai/LogoPreservingImageProvider";
import type { ImageGenerationResult } from "@/shared/ai/ImageGenerationProvider";

/**
 * MockMockupRenderProvider와 동일한 이유의 dependency-free 대체재 --
 * 실제 API 키 없이도 로고가 그대로 반영된(다시 그리지 않은) 결과를
 * 재현하기 위해, 첨부된 로고 이미지를 그대로 반환한다.
 */
export class MockLogoPreservingImageProvider implements LogoPreservingImageProvider {
  readonly name = "mock";

  async generate(request: LogoPreservingImageRequest): Promise<ImageGenerationResult> {
    return {
      images: [{ url: request.logoImageUrl, thumbnailUrl: request.logoImageUrl }],
      provider: this.name,
      model: "mock",
      costAmount: 0,
    };
  }
}
