import type { Metadata } from "next";
import { BASE_URL } from "@/shared/seo/baseUrl";
import { getLandingArticleLabels } from "@/features/landingArticles/labels";
import { getCategoryMeta } from "@/features/landingArticles/categoryMeta";
import { guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";

/**
 * /guides 허브(카테고리 디렉터리/카테고리별 목록/검색)의 <title>/description을
 * 상태별로 다르게 만든다 -- 이게 없으면 모든 상태가 루트 레이아웃의 범용
 * 타이틀만 그대로 물려받아 검색엔진에 전부 똑같은 페이지로 보인다.
 * 검색 결과 화면은 임의의 사용자 입력으로 만들어지는 저품질/중복 콘텐츠라
 * noindex 처리한다(구글 공식 권고 패턴).
 */
export function buildGuidesHubMetadata({
  locale,
  category,
  query,
}: {
  locale: string;
  category?: string;
  query?: string;
}): Metadata {
  const labels = getLandingArticleLabels(locale);
  const trimmedQuery = query?.trim();

  if (trimmedQuery) {
    return {
      title: `${labels.searchResultsFor}${trimmedQuery} - ASTER`,
      robots: { index: false, follow: true },
    };
  }

  if (category === "faq") {
    return {
      title: `${labels.faqHubTitle} - ASTER`,
      description: labels.faqHubIntro,
      alternates: { canonical: `${BASE_URL}${guidesHubHrefForCategory(locale, "faq")}` },
    };
  }

  if (category) {
    const meta = getCategoryMeta(category, locale);
    return {
      title: `${meta.label} - ASTER`,
      description: meta.description || labels.hubIntro,
      alternates: { canonical: `${BASE_URL}${guidesHubHrefForCategory(locale, category)}` },
    };
  }

  return {
    title: `${labels.hubTitle} - ASTER`,
    description: labels.hubIntro,
    alternates: { canonical: `${BASE_URL}${guidesHubHref(locale)}` },
  };
}
