import type { FileStorage } from "@/shared/storage/FileStorage";
import { LocalFileStorage } from "@/shared/storage/LocalFileStorage";
import { S3FileStorage } from "@/shared/storage/S3FileStorage";

/**
 * emailRouter.ts/textCompletionRouter.ts와 동일한 Provider Router 패턴 --
 * STORAGE_* 값이 없으면 로컬 디스크로 폴백해 로컬 개발은 그대로 키 없이
 * 동작한다. Railway처럼 앱/워커가 서로 다른 컨테이너라 로컬 디스크를 공유
 * 하지 못하는 배포 환경에서는 반드시 이 값들을 채워 실제 오브젝트 스토리지
 * (Cloudflare R2 등)를 써야 내보내기/내 스타일 이미지가 정상 동작한다.
 */
export function resolveFileStorage(): FileStorage {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (endpoint && bucket && accessKeyId && secretAccessKey) {
    return new S3FileStorage({
      endpoint,
      region: process.env.STORAGE_REGION || "auto",
      bucket,
      accessKeyId,
      secretAccessKey,
    });
  }
  return new LocalFileStorage();
}
