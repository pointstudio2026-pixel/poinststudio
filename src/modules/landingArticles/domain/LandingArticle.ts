// SEO 롱테일 랜딩페이지("활용사례"/가이드)의 콘텐츠 구조. n8n 콘텐츠
// 자동화 파이프라인이 이 형태로 채워서 POST /api/content/articles로
// 보낸다 -- 8단계 페이지 구조(정의/실제이미지/어울리는 업종/디테일 스펙/
// 어울리는 조합/FAQ/CTA)와 1:1로 대응한다 (title/displayTitle은 이 타입
// 밖의 LandingArticleTranslation 필드).
export interface LandingArticleContent {
  definition: string;
  images: { url: string; alt: string }[];
  industryFit: { industry: string; reason: string }[];
  detailSpec: { label: string; value: string }[];
  combos: { slug: string; label: string }[];
  faq: { question: string; answer: string }[];
  ctaLabel: string;
  ctaHref: string;
}

export type LandingArticleStatus = "draft" | "published";

export interface LandingArticleGroup {
  id: string;
  slug: string;
  category: string;
  createdAt: Date;
}

export interface LandingArticleTranslation {
  id: string;
  groupId: string;
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  content: LandingArticleContent;
  status: LandingArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 그룹 + 번역을 합친, 호출부가 실제로 필요로 하는 형태 -- slug/category는
 * 그룹에서, 나머지는 해당 locale의 번역 행에서 가져온다.
 */
export interface LandingArticle {
  slug: string;
  category: string;
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  content: LandingArticleContent;
  status: LandingArticleStatus;
  publishedAt: Date | null;
}
