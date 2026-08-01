import type { ImageGenerationResult, SizePreset } from "@/shared/ai/ImageGenerationProvider";

export interface LogoPreservingImageRequest {
  /** 실제 첨부된 로고 파일 -- data URI 또는 https URL. */
  logoImageUrl: string;
  systemPrompt: string;
  userPrompt: string;
  sizePreset?: SizePreset;
}

/**
 * "이미지 생성" 단계에서 사용자가 실제 로고를 첨부했을 때 쓰는 전용 포트 --
 * 일반 ImageGenerationProvider.edit()은 실제 픽셀을 참조하지 않는 "pragmatic
 * simplification"(텍스트 지시만 덧붙여 generate()를 다시 호출)이라 로고를
 * 그대로 보존하지 못한다. 이 포트는 OpenAIMockupRenderProvider와 동일하게
 * 실제 이미지 픽셀을 첨부하는 edit 엔드포인트를 호출해, 로고는 원본 그대로
 * 유지하면서 장면 전체는 매번 새로 생성한다(고정 목업 배경 템플릿 없음).
 */
export interface LogoPreservingImageProvider {
  readonly name: string;
  generate(request: LogoPreservingImageRequest): Promise<ImageGenerationResult>;
}
