import type { NextRequest } from "next/server";
import { AuthenticationError } from "@/shared/errors/AppError";

/**
 * n8n 콘텐츠 자동화 파이프라인이 호출하는 /api/content/* 엔드포인트 전용
 * 인증 -- 호출자가 로그인한 브라우저가 아니라 서버 워크플로우이므로
 * requireUser/requireAdmin(쿠키/JWT 세션 기반) 대신 고정 API 키 헤더로
 * 직접 인증한다.
 */
export function requireContentApiKey(request: NextRequest): void {
  const provided = request.headers.get("X-Content-Api-Key");
  const expected = process.env.N8N_CONTENT_API_KEY;
  if (!expected || !provided || provided !== expected) {
    throw new AuthenticationError("Invalid or missing X-Content-Api-Key", "CONTENT-001");
  }
}
