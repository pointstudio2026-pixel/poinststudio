export interface PlacementArea {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface MockupRenderRequest {
  logoImageUrl: string;
  backgroundUrl: string;
  placementArea: PlacementArea;
  templateName: string;
}

export interface MockupRenderResult {
  imageUrl: string;
  thumbnailUrl: string;
  provider: string;
  costAmount: number;
}

/**
 * 25_AIProviderArchitecture.md's Adapter Contract, specialized for mockup
 * compositing (Task-016): a logo image placed onto a real-world template
 * background. Business logic must never call a provider SDK directly --
 * only through this interface, resolved via mockupRenderRouter.
 */
export interface MockupRenderProvider {
  readonly name: string;
  render(request: MockupRenderRequest): Promise<MockupRenderResult>;
  health(): Promise<boolean>;
}
