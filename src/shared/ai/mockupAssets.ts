import fs from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
  svg: "svg+xml",
};

/**
 * SVG `<image href>` compositing (MockMockupRenderProvider) only reliably works
 * with data URIs -- an `<image href="/mockup-templates/xxx.jpg">` root-relative
 * path or even a full `http(s)://` URL is NOT fetched by every SVG renderer
 * (confirmed: it's silently blank when rasterized). Seeded template backgrounds
 * are stored as plain root-relative paths under public/ (readable, reusable
 * elsewhere, same pattern as LogoStyleCategory.sampleImageUrl) -- so resolve
 * them to a data URI here, at composite time, rather than storing giant base64
 * strings in the DB. `data:`/`http(s)://` values pass through unchanged for
 * backward compatibility with anything already stored that way.
 */
export async function resolveBackgroundDataUri(backgroundUrl: string): Promise<string> {
  if (backgroundUrl.startsWith("data:") || /^https?:\/\//.test(backgroundUrl)) {
    return backgroundUrl;
  }
  const filePath = path.join(process.cwd(), "public", backgroundUrl);
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(backgroundUrl).slice(1).toLowerCase();
  const mime = MIME_BY_EXTENSION[extension] ?? "png";
  return `data:image/${mime};base64,${buffer.toString("base64")}`;
}

export interface ResolvedImage {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Every generated-image provider (OpenAI/Gemini/Mock) returns image URLs as
 * `data:` URIs -- see OpenAIImageGenerationProvider/GeminiImageGenerationProvider.
 * `http(s)://`/public-relative paths are handled too, defensively, using the
 * same rules as resolveBackgroundDataUri.
 */
export async function resolveImageBuffer(imageUrl: string): Promise<ResolvedImage> {
  if (imageUrl.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/s.exec(imageUrl);
    if (!match) {
      throw new Error("Unsupported data URI format for mockup asset");
    }
    return { buffer: Buffer.from(match[2]!, "base64"), mimeType: match[1]! };
  }

  if (/^https?:\/\//.test(imageUrl)) {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch mockup asset image (${res.status})`);
    }
    const mimeType = res.headers.get("content-type") ?? "image/png";
    return { buffer: Buffer.from(await res.arrayBuffer()), mimeType };
  }

  const filePath = path.join(process.cwd(), "public", imageUrl);
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(imageUrl).slice(1).toLowerCase();
  return { buffer, mimeType: `image/${MIME_BY_EXTENSION[extension] ?? "png"}` };
}
