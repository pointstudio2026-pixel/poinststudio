import type { FileStorage, SavedFile } from "@/shared/storage/FileStorage";

export class FakeFileStorage implements FileStorage {
  files = new Map<string, { data: Buffer; contentType: string }>();

  async save(key: string, data: Buffer, contentType: string): Promise<SavedFile> {
    const extension = contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : "jpg";
    const fullKey = `${key}.${extension}`;
    this.files.set(fullKey, { data, contentType });
    return { key: fullKey, sizeBytes: data.byteLength };
  }

  async read(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    return this.files.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}
