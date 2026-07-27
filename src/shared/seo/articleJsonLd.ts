import { BASE_URL } from "@/shared/seo/baseUrl";
import { guideDetailHref, guidesHubHref } from "@/features/landingArticles/routing";
import type {
  FaqArticleContent,
  LandingArticle,
  StyleGuideContent,
  WhyAsterPageContent,
} from "@/modules/landingArticles/domain/LandingArticle";

/**
 * category별로 본문 필드가 다르므로(정의문/요약+본문/인트로) Article
 * 스키마의 articleBody도 ArticleDetailView의 렌더 분기와 똑같이 나눈다.
 */
function articleBodyFor(article: LandingArticle): string {
  if (article.category === "faq") {
    const content = article.content as FaqArticleContent;
    return [content.summary, ...content.body].join("\n\n");
  }
  if (article.category === "why-aster") {
    const content = article.content as WhyAsterPageContent;
    return [content.intro, ...content.benefits.map((b) => `${b.title}: ${b.description}`)].join("\n\n");
  }
  const content = article.content as StyleGuideContent;
  return content.definition;
}

export function buildArticleJsonLd(locale: string, article: LandingArticle) {
  const url = `${BASE_URL}${guideDetailHref(locale, article.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    articleBody: articleBodyFor(article),
    inLanguage: locale,
    url,
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: "ASTER", url: BASE_URL },
  };
}

/**
 * 스타일 가이드 글에만 붙는 소형 FAQ 블록(StyleGuideContent.faq)을
 * FAQPage 스키마로 노출한다 -- category === "faq" 글은 질문 하나짜리
 * 단일 아티클 구조라 FAQPage보다 위 Article 스키마가 맞다.
 */
export function buildFaqPageJsonLd(article: LandingArticle) {
  if (article.category !== "style") return null;
  const content = article.content as StyleGuideContent;
  if (!content.faq || content.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function buildBreadcrumbJsonLd(locale: string, article: LandingArticle) {
  const hasHubCrumb = article.category === "style" || article.category === "faq";
  const items = [{ name: "ASTER", url: BASE_URL }];
  if (hasHubCrumb) {
    items.push({ name: "Guides", url: `${BASE_URL}${guidesHubHref(locale)}` });
  }
  items.push({ name: article.displayTitle, url: `${BASE_URL}${guideDetailHref(locale, article.slug)}` });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
