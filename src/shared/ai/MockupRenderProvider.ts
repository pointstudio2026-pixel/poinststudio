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
  /**
   * TrainingExample(category="목업")에서 찾은 참고 문구(연출/합성 스타일
   * 가이드) -- 없으면 생략된다(기존 프로젝트/템플릿과 100% 동일하게 동작).
   * 이미지 생성 DB("이미지생성" 카테고리)와는 절대 섞이지 않는다.
   */
  referenceExampleText?: string;
  /** 평가 점수 60점 미만인 과거 목업 결과 중 매칭된 것 -- "이런 연출은 피하라"는 회피 지침. 없으면 생략. */
  avoidPatternText?: string;
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
