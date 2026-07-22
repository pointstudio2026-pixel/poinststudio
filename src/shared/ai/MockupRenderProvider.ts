export interface PlacementArea {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

/**
 * "logo": a small brand mark composited into placementArea (branding-only
 * projects -- the only thing that's ever generated for them IS a logo).
 * "fullDesign": a complete, already-finished deliverable (poster, brochure,
 * business card face, ...) composited large into placementArea, unchanged.
 * Mock compositing treats both the same (it just draws logoImageUrl into
 * placementArea); only the real OpenAI provider varies its prompt per mode.
 */
export type MockupCompositingMode = "logo" | "fullDesign";

export interface MockupRenderRequest {
  logoImageUrl: string;
  backgroundUrl: string;
  placementArea: PlacementArea;
  templateName: string;
  compositingMode: MockupCompositingMode;
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
