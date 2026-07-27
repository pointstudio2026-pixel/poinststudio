// 가이드 페이지는 두 개의 URL 존으로 나뉜다: 한국어(기본/무접두사)와
// 나머지 4개 언어(접두사 있음, /{locale}/guides/...) -- ArticleHubView/
// ArticleDetailView가 조합 링크 등을 만들 때 항상 이 헬퍼로 href를
// 만들어야 두 존에서 동일한 로직을 유지할 수 있다.
export function guidesHubHref(locale: string): string {
  return locale === "ko" ? "/guides" : `/${locale}/guides`;
}

export function guideDetailHref(locale: string, slug: string): string {
  return locale === "ko" ? `/guides/${slug}` : `/${locale}/guides/${slug}`;
}

/**
 * 카테고리별로 필터링된 허브 링크 -- FAQ처럼 "허브 하나 + 개별 게시글 여러
 * 개"로 다루는 카테고리를 스타일 가이드 허브와 같은 화면(다른 URL 없이
 * ?category= 쿼리로만 구분)에서 보여줄 때 쓴다.
 */
export function guidesHubHrefForCategory(locale: string, category: string): string {
  return `${guidesHubHref(locale)}?category=${encodeURIComponent(category)}`;
}
