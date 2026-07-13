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

/**
 * 25_AIProviderArchitecture.md's Adapter Contract, specialized for image
 * generation (Task-013). Business logic must never call a provider SDK
 * directly -- only through this interface, resolved via
 * imageGenerationRouter.
 */
export interface ImageGenerationProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  health(): Promise<boolean>;
}
