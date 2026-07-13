import type { ProviderHealthStatus } from "@/modules/admin/domain/Admin";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";

export class GetProviderHealthUseCase {
  constructor(
    private readonly textCompletionProvider: TextCompletionProvider,
    private readonly imageGenerationProvider: ImageGenerationProvider,
    private readonly mockupRenderProvider: MockupRenderProvider,
  ) {}

  async execute(): Promise<ProviderHealthStatus[]> {
    const [text, image, mockup] = await Promise.all([
      this.textCompletionProvider.health().catch(() => false),
      this.imageGenerationProvider.health().catch(() => false),
      this.mockupRenderProvider.health().catch(() => false),
    ]);

    return [
      { provider: "text_completion", name: this.textCompletionProvider.name, healthy: text },
      { provider: "image_generation", name: this.imageGenerationProvider.name, healthy: image },
      { provider: "mockup_render", name: this.mockupRenderProvider.name, healthy: mockup },
    ];
  }
}
