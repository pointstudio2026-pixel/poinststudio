import { createHash } from "node:crypto";
import type {
  GeneratedImageResult,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from "@/shared/ai/ImageGenerationProvider";
import { ProviderError } from "@/shared/errors/AppError";

const PALETTE: [string, string][] = [
  ["#1f2937", "#f9fafb"],
  ["#0f766e", "#ecfeff"],
  ["#7c2d12", "#fff7ed"],
  ["#312e81", "#eef2ff"],
  ["#854d0e", "#fefce8"],
  ["#166534", "#f0fdf4"],
];

/** Test-only hook to deterministically exercise the failure/retry path. */
export const FORCE_FAILURE_MARKER = "FORCE_FAIL_TEST";

function seedFrom(text: string, index: number): number {
  const hash = createHash("sha256").update(`${text}:${index}`).digest();
  return hash.readUInt32BE(0);
}

function buildSvgDataUri(seed: number, size: number, label: string): string {
  const [bg, fg] = PALETTE[seed % PALETTE.length]!;
  const shapeKind = seed % 3;
  const shape =
    shapeKind === 0
      ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.28}" fill="${fg}" opacity="0.85"/>`
      : shapeKind === 1
        ? `<rect x="${size * 0.22}" y="${size * 0.22}" width="${size * 0.56}" height="${size * 0.56}" fill="${fg}" opacity="0.85"/>`
        : `<polygon points="${size / 2},${size * 0.18} ${size * 0.82},${size * 0.82} ${size * 0.18},${size * 0.82}" fill="${fg}" opacity="0.85"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${bg}"/>${shape}` +
    `<text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="${size * 0.06}" fill="${fg}">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Deterministic, dependency-free stand-in used whenever no real image
 * provider is configured. Renders real, browser-displayable inline SVG
 * data URIs (no external storage/object-storage setup needed for the
 * MVP) seeded from the prompt text, so the same prompt always yields the
 * same concept images -- keeping the whole pipeline testable end-to-end
 * without a real provider key. See imageGenerationRouter.
 */
export class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "mock";

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (request.userPrompt.includes(FORCE_FAILURE_MARKER)) {
      throw new ProviderError("Mock provider: 강제 실패 트리거(테스트 전용)");
    }

    const images: GeneratedImageResult[] = [];
    for (let i = 0; i < request.count; i++) {
      const seed = seedFrom(request.userPrompt, i);
      images.push({
        url: buildSvgDataUri(seed, 512, `Concept ${i + 1}`),
        thumbnailUrl: buildSvgDataUri(seed, 128, `${i + 1}`),
      });
    }

    return { images, provider: this.name, model: "template-svg-v1", costAmount: 0 };
  }

  async health(): Promise<boolean> {
    return true;
  }
}
