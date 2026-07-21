import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type { FileStorage, SavedFile } from "@/shared/storage/FileStorage";

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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isNotFoundError(err: unknown): boolean {
  const name = (err as { name?: string } | undefined)?.name;
  return name === "NoSuchKey" || name === "NotFound";
}

/**
 * S3 호환 오브젝트 스토리지(Cloudflare R2 등) 어댑터 -- LocalFileStorage와
 * 동일한 FileStorage 계약을 구현한다. Railway 같은 배포 환경은 서비스(앱/
 * 워커) 간에 로컬 디스크를 공유하지 않으므로(워커가 만든 내보내기 파일을
 * 앱이 읽을 수 없음), 실제 배포에서는 이 어댑터가 필요하다 -- 어느 쪽을
 * 쓸지는 fileStorageRouter.ts가 환경변수 유무로 결정한다. R2는 S3 API와
 * 호환되므로 AWS SDK를 그대로 재사용한다(별도 R2 전용 SDK 불필요).
 */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      forcePathStyle: true,
    });
  }

  async save(key: string, data: Buffer, contentType: string): Promise<SavedFile> {
    const fullKey = `${key}.${extensionFor(contentType)}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: fullKey, Body: data, ContentType: contentType }),
    );
    return { key: fullKey, sizeBytes: data.byteLength };
  }

  async read(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const data = await streamToBuffer(result.Body as Readable);
      const extension = key.includes(".") ? key.split(".").pop()! : "";
      return { data, contentType: contentTypeForExtension(extension) };
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
