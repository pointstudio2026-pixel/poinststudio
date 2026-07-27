import type { LandingArticleRepository } from "@/modules/landingArticles/domain/LandingArticleRepository";
import type { LandingArticle, LandingArticleContent, LandingArticleStatus } from "@/modules/landingArticles/domain/LandingArticle";
import { ValidationError } from "@/shared/errors/AppError";
import { LOCALES } from "@/shared/i18n/locale";

const VALID_STATUSES: LandingArticleStatus[] = ["draft", "published"];

export interface PublishLandingArticleUseCaseInput {
  slug: string;
  category: string;
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  status: LandingArticleStatus;
  content: LandingArticleContent;
}

/**
 * n8n 콘텐츠 파이프라인이 호출하는 발행/초안저장 유스케이스 -- API 라우트가
 * zod로 이미 한 번 검증하지만, 유스케이스 자체도 (다른 호출부가 생기더라도
 * 안전하도록) 최소한의 필수값 검증을 다시 한다.
 */
export class PublishLandingArticleUseCase {
  constructor(private readonly landingArticleRepository: LandingArticleRepository) {}

  async execute(input: PublishLandingArticleUseCaseInput): Promise<LandingArticle> {
    if (!input.slug) {
      throw new ValidationError("slug는 필수입니다.");
    }
    if (!input.category) {
      throw new ValidationError("category는 필수입니다.");
    }
    if (!input.locale || !(LOCALES as readonly string[]).includes(input.locale)) {
      throw new ValidationError(`locale은 ${LOCALES.join("|")} 중 하나여야 합니다.`);
    }
    if (!input.title) {
      throw new ValidationError("title은 필수입니다.");
    }
    if (!input.content) {
      throw new ValidationError("content는 필수입니다.");
    }
    if (!VALID_STATUSES.includes(input.status)) {
      throw new ValidationError("status는 draft 또는 published여야 합니다.");
    }

    return this.landingArticleRepository.upsertTranslation({
      slug: input.slug,
      category: input.category,
      locale: input.locale,
      title: input.title,
      displayTitle: input.displayTitle,
      metaDescription: input.metaDescription,
      content: input.content,
      status: input.status,
    });
  }
}
