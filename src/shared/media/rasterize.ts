import sharp from "sharp";
import { ProviderError } from "@/shared/errors/AppError";

export type RasterFormat = "png" | "jpg";

async function toInputBuffer(dataUriOrUrl: string): Promise<Buffer> {
  if (dataUriOrUrl.startsWith("data:")) {
    const base64 = dataUriOrUrl.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }
  const res = await fetch(dataUriOrUrl);
  if (!res.ok) {
    throw new ProviderError(`이미지를 가져오지 못했습니다 (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Rasterizes any of this app's image sources (inline SVG data URIs from
 * the Mock providers, or a real provider's hosted PNG/JPEG URL) into
 * concrete PNG/JPEG bytes -- used for both direct PNG/JPG export and for
 * embedding images into PDF Concept Board exports (pdf-lib only accepts
 * PNG/JPEG, not SVG).
 */
export async function rasterizeImage(
  dataUriOrUrl: string,
  options: { format: RasterFormat; maxSize?: number },
): Promise<Buffer> {
  const input = await toInputBuffer(dataUriOrUrl);
  let pipeline = sharp(input);
  if (options.maxSize) {
    pipeline = pipeline.resize({ width: options.maxSize, height: options.maxSize, fit: "inside" });
  }
  try {
    return await (options.format === "png" ? pipeline.png() : pipeline.jpeg({ quality: 90 })).toBuffer();
  } catch (err) {
    throw new ProviderError("이미지 변환에 실패했습니다.", {
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
