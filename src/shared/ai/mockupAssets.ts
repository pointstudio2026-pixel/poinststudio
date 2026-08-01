import fs from "node:fs/promises";
import path from "node:path";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
  svg: "svg+xml",
};

/** 관리자 목업 배경 생성 플로우(2026-08-01)가 만든 템플릿은 public/ 정적
 * 파일이 아니라 실제 오브젝트 스토리지(R2 등)에 저장되고, /api/content/
 * images/{key} 공개 라우트로 서빙된다 -- 그 라우트가 하는 일(resolveFileStorage
 * ().read())을 여기서도 그대로 하면 되므로, 이 앱 자신에게 다시 HTTP
 * 요청을 보내는 대신(배포 토폴로지에 따라 실패할 수 있음) 직접
 * FileStorage에서 읽는다. public/ 배포 파일과 달리 git 커밋/배포 없이
 * 즉시 반영되는 게 이 경로의 핵심 목적이다.
 */
const CONTENT_IMAGES_PREFIX = "/api/content/images/";

async function readContentImage(backgroundUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const key = backgroundUrl.slice(CONTENT_IMAGES_PREFIX.length);
  const file = await resolveFileStorage().read(key);
  if (!file) throw new Error(`Content image not found for key: ${key}`);
  return { buffer: file.data, mimeType: file.contentType };
}

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
  if (backgroundUrl.startsWith(CONTENT_IMAGES_PREFIX)) {
    const { buffer, mimeType } = await readContentImage(backgroundUrl);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
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

  if (imageUrl.startsWith(CONTENT_IMAGES_PREFIX)) {
    return readContentImage(imageUrl);
  }

  const filePath = path.join(process.cwd(), "public", imageUrl);
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(imageUrl).slice(1).toLowerCase();
  return { buffer, mimeType: `image/${MIME_BY_EXTENSION[extension] ?? "png"}` };
}
