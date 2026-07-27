import type { MetadataRoute } from "next";
import { BASE_URL } from "@/shared/seo/baseUrl";
import { LOCALES } from "@/shared/i18n/locale";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { guideDetailHref } from "@/features/landingArticles/routing";

// 로그인 뒤에만 볼 수 있는 화면(프로젝트/관리자 등)은 검색엔진이 크롤링해도
// 의미가 없으므로 제외하고, 실제 마케팅/정보성 공개 페이지 + 발행된
// "활용사례" 가이드(5개 언어 존 전체)만 등록한다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const articleEntries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    const articles = await landingArticlesContainer.listLandingArticlesUseCase.execute({ locale });
    for (const article of articles) {
      articleEntries.push({
        url: `${BASE_URL}${guideDetailHref(locale, article.slug)}`,
        lastModified: article.publishedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return [...staticEntries, ...articleEntries];
}
