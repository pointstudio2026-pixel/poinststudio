import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage, SavedFile } from "@/shared/storage/FileStorage";

const STORAGE_ROOT = path.join(process.cwd(), "var", "exports");

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

function extensionFor(contentType: string): string {
  return EXTENSION_BY_CONTENT_TYPE[contentType] ?? "bin";
}

function contentTypeForExtension(extension: string): string {
  const entry = Object.entries(EXTENSION_BY_CONTENT_TYPE).find(([, ext]) => ext === extension);
  return entry?.[0] ?? "application/octet-stream";
}

/**
 * Stand-in for a real Object Storage provider (S3/GCS) -- writes to a
 * local, git-ignored directory. The "key" already encodes the content
 * type via its file extension, so no separate metadata sidecar is needed.
 */
export class LocalFileStorage implements FileStorage {
  async save(key: string, data: Buffer, contentType: string): Promise<SavedFile> {
    const fullKey = `${key}.${extensionFor(contentType)}`;
    const filePath = path.join(STORAGE_ROOT, fullKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return { key: fullKey, sizeBytes: data.byteLength };
  }

  async read(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    const filePath = path.join(STORAGE_ROOT, key);
    try {
      const data = await readFile(filePath);
      const extension = path.extname(key).replace(".", "");
      return { data, contentType: contentTypeForExtension(extension) };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(STORAGE_ROOT, key);
    await rm(filePath, { force: true });
  }
}
