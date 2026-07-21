/** 실제 인쇄/화면 비율에 대응하는 3가지 프리셋 -- 각 Provider 어댑터가 자기 API의 크기 표현으로 매핑한다. */
export type SizePreset = "square" | "portrait" | "landscape";

export interface ImageGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  count: number;
  /** 생략 시 각 Provider가 "square"로 처리한다(기존 기본 동작과 동일). */
  sizePreset?: SizePreset;
}

export interface GeneratedImageResult {
  url: string;
  thumbnailUrl: string;
}

export interface ImageGenerationResult {
  images: GeneratedImageResult[];
  provider: string;
  model: string;
  costAmount: number;
}

export interface ImageEditRequest {
  sourceImageUrl: string;
  systemPrompt: string;
  editInstruction: string;
}

/**
 * 25_AIProviderArchitecture.md's Adapter Contract: `generate` and `edit`
 * are siblings on the same provider (Task-013 / Task-014). Business logic
 * must never call a provider SDK directly -- only through this interface,
 * resolved via imageGenerationRouter.
 */
export interface ImageGenerationProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  edit(request: ImageEditRequest): Promise<ImageGenerationResult>;
  health(): Promise<boolean>;
}
