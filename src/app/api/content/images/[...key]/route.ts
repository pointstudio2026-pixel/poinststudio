import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { toApiError } from "@/shared/http/response";
import { NotFoundError } from "@/shared/errors/AppError";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

/**
 * generate-image가 저장한 파일을 공개로 서빙한다 -- 로그인 없이 검색엔진/
 * 방문자가 볼 수 있어야 하는 공개 가이드 페이지 이미지라, 다른 FileStorage
 * 서빙 라우트(로고/내 스타일 등)와 달리 인증을 요구하지 않는다. key에 슬래시가
 * 포함되므로([...key]) catch-all 라우트로 받는다.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const fileStorage = resolveFileStorage();
    const file = await fileStorage.read(key.join("/"));
    if (!file) {
      throw new NotFoundError("이미지를 찾을 수 없습니다.", "CONTENT_IMAGE_NOT_FOUND");
    }

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        // 콘텐츠 파이프라인 이미지는 randomUUID 기반 키라 같은 키가 다른
        // 내용으로 바뀔 일이 없다 -- 공개적으로 오래 캐시해도 안전하다.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return toApiError(err);
  }
}
