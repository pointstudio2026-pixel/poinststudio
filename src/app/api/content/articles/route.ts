import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { ValidationError } from "@/shared/errors/AppError";
import { requireContentApiKey } from "@/shared/http/contentApiKey";
import { publishLandingArticleSchema } from "@/modules/landingArticles/schemas/landingArticle.schemas";
import { landingArticlesContainer } from "@/modules/landingArticles/container";

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
