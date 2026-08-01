// SEO 롱테일 랜딩페이지("활용사례"/가이드)의 콘텐츠 구조. n8n 콘텐츠
// 자동화 파이프라인이 이 형태로 채워서 POST /api/content/articles로
// 보낸다 -- 8단계 페이지 구조(정의/실제이미지/어울리는 업종/디테일 스펙/
// 어울리는 조합/FAQ/CTA)와 1:1로 대응한다 (title/displayTitle은 이 타입
// 밖의 LandingArticleTranslation 필드). category === "style"(과 앞으로 늘어날
// 스타일×업종/작업물유형 등)에서만 쓰인다.
export interface StyleGuideContent {
  definition: string;
  images: { url: string; alt: string }[];
  industryFit: { industry: string; reason: string }[];
  detailSpec: { label: string; value: string }[];
  combos: { slug: string; label: string }[];
  faq: { question: string; answer: string }[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * category === "faq" 전용 콘텐츠 구조 -- 질문 하나당 독립된 게시글 하나
 * (허브 + 개별 글 구조, 스타일 가이드와 동일한 패턴을 그대로 따른다). 처음엔
 * 한 페이지에 Q&A를 다 나열하는 방식이었으나, 각 질문을 더 짜임새 있게
 * 다루기 위해(요약+본문+핵심 포인트+관련 질문) 개별 글로 분리했다.
 */
export interface FaqArticleContent {
  summary: string;
  body: string[];
  /** 스타일 가이드(StyleGuideContent.images)와 동일한 패턴 -- 빈 배열이면 이미지 섹션 자체를 렌더링하지 않는다. */
  images: { url: string; alt: string }[];
  keyPoints: { label: string; value: string }[];
  relatedQuestions: { slug: string; label: string }[];
  ctaLabel: string;
  ctaHref: string;
  /**
   * 선택적 비교/참고 표 -- "Aster는?"(구 자유 주제) 카테고리처럼 비교형
   * 콘텐츠에서 쓰인다. 일반 FAQ 질문 글은 비워도 된다.
   */
  table?: { caption: string; headers: string[]; rows: string[][] };
  /**
   * 2026-08-01 추가: 본문 문단 하나가 끝난 직후에 링크 하나씩 끼워 넣을 때
   * 쓴다 -- 예: 경쟁 사이트 비교 글에서 각 사이트 소개 문단 뒤에 그
   * 사이트로 가는 링크를 하나씩 붙이는 경우. afterParagraphIndex는
   * body 배열의 0-based 인덱스(그 문단 바로 다음에 렌더링). external이
   * true면 새 탭 + rel="nofollow noopener noreferrer"로 열어 검색엔진에
   * 순위 가치를 넘기지 않는다(외부/경쟁 사이트 링크용) -- Aster 등 내부
   * 링크는 external을 생략하거나 false로 둔다. 없으면(대부분의 일반
   * FAQ) 렌더링 자체를 생략한다.
   */
  inlineLinks?: { afterParagraphIndex: number; label: string; href: string; external?: boolean }[];
}

/** category === "why-aster" 전용 콘텐츠 구조 -- 강점/혜택 나열 + CTA. */
export interface WhyAsterPageContent {
  intro: string;
  benefits: { title: string; description: string }[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * 카테고리마다 콘텐츠 모양이 다르다 -- 스타일 가이드(정의/업종/스펙/조합/
 * FAQ/CTA), FAQ 페이지(질문 목록), Why ASTER 페이지(강점 목록)는 서로 겹치는
 * 필드가 거의 없어 하나의 고정 인터페이스로 억지로 합치지 않는다. 렌더링
 * 쪽(ArticleDetailView)은 항상 article.category로 분기해서 알맞은 타입으로
 * 다룬다 -- category가 신뢰할 수 있는 판별 필드.
 */
export type LandingArticleContent = StyleGuideContent | FaqArticleContent | WhyAsterPageContent;

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
