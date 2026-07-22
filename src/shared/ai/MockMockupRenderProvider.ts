import type {
  MockupRenderProvider,
  MockupRenderRequest,
  MockupRenderResult,
} from "@/shared/ai/MockupRenderProvider";
import { resolveBackgroundDataUri } from "@/shared/ai/mockupAssets";
import { ProviderError } from "@/shared/errors/AppError";

/** Test-only hook to deterministically exercise the failure/retry path. */
export const FORCE_FAILURE_MARKER = "FORCE_FAIL_TEST";

function buildCompositeSvgDataUri(request: MockupRenderRequest, resolvedBackgroundUrl: string, size: number): string {
  const { placementArea } = request;
  const x = (placementArea.xPct / 100) * size;
  const y = (placementArea.yPct / 100) * size;
  const width = (placementArea.widthPct / 100) * size;
  const height = (placementArea.heightPct / 100) * size;

  // Both the background and the logo are already renderable data URIs at
  // this point, so real compositing is just layering two <image> refs -- no
  // canvas/sharp needed.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<image href="${resolvedBackgroundUrl}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>` +
    `<image href="${request.logoImageUrl}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Deterministic, dependency-free stand-in used whenever no real mockup
 * provider is configured. Composites the selected logo onto the template
 * background by nesting data-URI <image> elements in a fresh SVG -- a
 * real, browser-renderable composite without canvas/sharp/object storage.
 */
export class MockMockupRenderProvider implements MockupRenderProvider {
  readonly name = "mock";

  async render(request: MockupRenderRequest): Promise<MockupRenderResult> {
    if (request.templateName.includes(FORCE_FAILURE_MARKER)) {
      throw new ProviderError("Mock provider: 강제 실패 트리거(테스트 전용)");
    }

    const resolvedBackgroundUrl = await resolveBackgroundDataUri(request.backgroundUrl);

    return {
      imageUrl: buildCompositeSvgDataUri(request, resolvedBackgroundUrl, 512),
      thumbnailUrl: buildCompositeSvgDataUri(request, resolvedBackgroundUrl, 128),
      provider: this.name,
      costAmount: 0,
    };
  }

  async health(): Promise<boolean> {
    return true;
  }
}
