import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { AuthenticationError, ValidationError } from "@/shared/errors/AppError";
import { publishLandingArticleSchema } from "@/modules/landingArticles/schemas/landingArticle.schemas";
import { landingArticlesContainer } from "@/modules/landingArticles/container";

// n8n 콘텐츠 자동화 파이프라인 전용 엔드포인트 -- 호출자가 로그인한
// 브라우저가 아니라 서버 워크플로우이므로 requireUser/requireAdmin(쿠키/
// JWT 세션 기반)을 쓰지 않고, 고정 API 키 헤더로 직접 인증한다.
function requireContentApiKey(request: NextRequest): void {
  const provided = request.headers.get("X-Content-Api-Key");
  const expected = process.env.N8N_CONTENT_API_KEY;
  if (!expected || !provided || provided !== expected) {
    throw new AuthenticationError("Invalid or missing X-Content-Api-Key", "CONTENT-001");
  }
}

export async function POST(request: NextRequest) {
  try {
    requireContentApiKey(request);

    const body = await request.json().catch(() => null);
    const parsed = publishLandingArticleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const article = await landingArticlesContainer.publishLandingArticleUseCase.execute(parsed.data);

    return apiSuccess({ article }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
