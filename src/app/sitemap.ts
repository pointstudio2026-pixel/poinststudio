import type { MetadataRoute } from "next";
import { BASE_URL } from "@/shared/seo/baseUrl";
import { LOCALES } from "@/shared/i18n/locale";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { guideDetailHref } from "@/features/landingArticles/routing";

// 로그인 뒤에만 볼 수 있는 화면(프로젝트/관리자 등)은 검색엔진이 크롤링해도
// 의미가 없으므로 제외하고, 실제 마케팅/정보성 공개 페이지 + 발행된
// "활용사례" 가이드(5개 언어 존 전체)만 등록한다.
//
// force-dynamic 필수 -- DB를 조회하게 된 뒤로는 빌드 시점에 정적 생성하면
// 안 된다(빌드 컨테이너는 Postgres/Redis에 못 닿아서 빌드 자체가 죽는다 --
// 실제로 이 파일 + guides 페이지들이 원인이 되어 배포가 연속 실패했다).
// 매 요청마다 새로 조회하는 대신 revalidate로 캐시할 수도 있지만, 새 글이
// 게시되자마자 sitemap에 반영되는 게 더 중요하다고 판단해 캐시 없이 감.
export const dynamic = "force-dynamic";

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
