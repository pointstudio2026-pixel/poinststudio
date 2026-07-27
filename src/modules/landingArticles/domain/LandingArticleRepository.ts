import type { LandingArticle, LandingArticleContent, LandingArticleStatus } from "@/modules/landingArticles/domain/LandingArticle";

export interface UpsertLandingArticleTranslationInput {
  slug: string;
  category: string;
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  content: LandingArticleContent;
  status: LandingArticleStatus;
}

export interface ListLandingArticlesParams {
  locale: string;
  category?: string;
}

export interface LandingArticleRepository {
  /**
   * slug로 그룹이 없으면 주어진 category로 새로 만들고, 있으면 그대로 둔다
   * (category는 그룹 생성 시점에 딱 한 번 정해지는 속성 -- 이후 다른
   * locale을 upsert해도 category는 절대 바뀌지 않는다). 번역은
   * (groupId, locale) 기준으로 upsert한다.
   */
  upsertTranslation(input: UpsertLandingArticleTranslationInput): Promise<LandingArticle>;

  /** status가 "published"인 것만 반환한다 (미리보기 모드 없음, 지금은 필요 없음). */
  findBySlugAndLocale(slug: string, locale: string): Promise<LandingArticle | null>;

  /** publishedAt 내림차순. */
  listPublished(params: ListLandingArticlesParams): Promise<LandingArticle[]>;
}
