import { createHash } from "node:crypto";
import type {
  GeneratedImageResult,
  ImageEditRequest,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  SizePreset,
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

// A4/B4 계열(root-2 용지)의 세로:가로 비율(약 1:1.414)에 가깝게 근사 -- 실제
// OpenAI 어댑터가 요청하는 "1024x1536"/"1536x1024"와 같은 비율 계열.
const PORTRAIT_RATIO = 1024 / 1536;

function dimensionsFor(baseSize: number, sizePreset: SizePreset): { width: number; height: number } {
  if (sizePreset === "portrait") {
    return { width: Math.round(baseSize * PORTRAIT_RATIO), height: baseSize };
  }
  if (sizePreset === "landscape") {
    return { width: baseSize, height: Math.round(baseSize * PORTRAIT_RATIO) };
  }
  return { width: baseSize, height: baseSize };
}

function buildSvgDataUri(seed: number, baseSize: number, label: string, sizePreset: SizePreset = "square"): string {
  const { width, height } = dimensionsFor(baseSize, sizePreset);
  const shortSide = Math.min(width, height);
  const [bg, fg] = PALETTE[seed % PALETTE.length]!;
  const shapeKind = seed % 3;
  const shape =
    shapeKind === 0
      ? `<circle cx="${width / 2}" cy="${height / 2}" r="${shortSide * 0.28}" fill="${fg}" opacity="0.85"/>`
      : shapeKind === 1
        ? `<rect x="${(width - shortSide * 0.56) / 2}" y="${(height - shortSide * 0.56) / 2}" width="${shortSide * 0.56}" height="${shortSide * 0.56}" fill="${fg}" opacity="0.85"/>`
        : `<polygon points="${width / 2},${height * 0.18} ${width * 0.82},${height * 0.82} ${width * 0.18},${height * 0.82}" fill="${fg}" opacity="0.85"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${bg}"/>${shape}` +
    `<text x="50%" y="95%" text-anchor="middle" font-family="sans-serif" font-size="${shortSide * 0.06}" fill="${fg}">${label}</text>` +
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

    const sizePreset = request.sizePreset ?? "square";
    const images: GeneratedImageResult[] = [];
    for (let i = 0; i < request.count; i++) {
      const seed = seedFrom(request.userPrompt, i);
      images.push({
        url: buildSvgDataUri(seed, 512, `Concept ${i + 1}`, sizePreset),
        thumbnailUrl: buildSvgDataUri(seed, 128, `${i + 1}`, sizePreset),
      });
    }

    return { images, provider: this.name, model: "template-svg-v1", costAmount: 0 };
  }

  async edit(request: ImageEditRequest): Promise<ImageGenerationResult> {
    if (request.editInstruction.includes(FORCE_FAILURE_MARKER)) {
      throw new ProviderError("Mock provider: 강제 실패 트리거(테스트 전용)");
    }

    // Seeded from the source image + instruction (not the original prompt)
    // so the result is deterministic yet visibly different from the source.
    const seed = seedFrom(`${request.sourceImageUrl}:${request.editInstruction}`, 1);
    const image: GeneratedImageResult = {
      url: buildSvgDataUri(seed, 512, "Edited"),
      thumbnailUrl: buildSvgDataUri(seed, 128, "Edit"),
    };

    return { images: [image], provider: this.name, model: "template-svg-edit-v1", costAmount: 0 };
  }

  async health(): Promise<boolean> {
    return true;
  }
}
