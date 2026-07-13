export interface ImageGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  count: number;
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
